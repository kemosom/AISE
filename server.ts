import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { dbStore, type LabEntity } from './lib/db/store';
import { getDataProvider } from './lib/data/provider';
import {
  createSessionToken,
  verifySessionToken,
  verifyPassword,
  toPublicUser,
} from './lib/auth/session';
import type { AuthSession } from './lib/auth/types';
import { LabRegistry } from './labs/registry';
import { getStorageProvider } from './lib/storage/provider';
import { generateDocxReport } from './lib/reports/docx-generator';
import { generateSubmissionsZip } from './lib/reports/zip-generator';
import {
  decryptInstructorContent,
  instructorAccessConfigured,
  validateInstructorCode,
} from './server/instructor-access';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Auth Middleware
interface AuthenticatedRequest extends Request {
  sessionUser?: AuthSession;
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Check cookie or Authorization header
  const token = req.cookies?.aise_session || req.headers.authorization?.replace(/^Bearer\s+/, '');
  const session = verifySessionToken(token);

  if (session) {
    req.sessionUser = session;
  }
  next();
}

app.use(authMiddleware);

function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  if (!req.sessionUser) {
    // Open academic access mode: provide a guest session so any student can access without credentials
    req.sessionUser = {
      userId: 'open-student',
      email: 'student@mai5124.academic',
      name: '',
      studentId: '',
      role: 'student',
      issuedAt: Date.now(),
    };
  }
  next();
}

function requireLecturerOrAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const role = req.sessionUser?.role?.toLowerCase();
  if (!req.sessionUser || (role !== 'lecturer' && role !== 'admin')) {
    return res.status(403).json({ error: 'Access forbidden: Lecturer or Administrator authorization required.' });
  }
  next();
}

// ==========================================
// 1. SYSTEM & CONFIGURATION
// ==========================================

// GET /api/system/mode
app.get('/api/system/mode', (_req: Request, res: Response) => {
  const provider = getDataProvider();
  return res.json({
    mode: provider.mode,
    isConfigured: provider.mode === 'supabase',
  });
});

// Instructor-only material for local Express development.
app.post('/api/instructor', (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (!instructorAccessConfigured()) {
    return res.status(503).json({
      error: 'Instructor access is not configured for this environment.',
    });
  }

  if (!validateInstructorCode(req.body?.code)) {
    return res.status(401).json({ error: 'Invalid instructor code.' });
  }

  try {
    return res.json({ ok: true, data: decryptInstructorContent() });
  } catch {
    return res.status(500).json({
      error: 'Instructor material could not be decrypted.',
    });
  }
});

// ==========================================
// 2. AUTHENTICATION ROUTES
// ==========================================

// POST /api/auth/login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = dbStore.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid institutional credentials.' });
  }

  const valid = verifyPassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid institutional credentials.' });
  }

  const token = createSessionToken(user);

  res.cookie('aise_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({
    user: toPublicUser(user),
    token, // Provided for client storage fallback
  });
});

// GET /api/auth/me
app.get('/api/auth/me', (req: AuthenticatedRequest, res: Response) => {
  if (req.sessionUser) {
    const user = dbStore.getUserById(req.sessionUser.userId);
    if (user) {
      return res.json({ user: toPublicUser(user) });
    }
  }
  // Return open access student
  return res.json({
    user: {
      id: 'open-student',
      email: 'student@mai5124.academic',
      name: '',
      studentId: '',
      role: 'student',
    },
  });
});

// POST /api/auth/change-password
app.post('/api/auth/change-password', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.sessionUser!.userId;
  const user = dbStore.getUserById(userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (oldPassword && !verifyPassword(oldPassword, user.passwordHash)) {
    return res.status(400).json({ error: 'Current password does not match.' });
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
  }

  dbStore.updateUserPassword(userId, newPassword);
  const updatedUser = dbStore.getUserById(userId)!;
  const newToken = createSessionToken(updatedUser);

  res.cookie('aise_session', newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({
    success: true,
    user: toPublicUser(updatedUser),
    token: newToken,
  });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.clearCookie('aise_session');
  return res.json({ success: true });
});

// ==========================================
// 2. LABORATORY ROUTES & ACCESS CONTROL
// ==========================================

// GET /api/labs
app.get('/api/labs', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const labs = dbStore.getLabs();
  const manifests = LabRegistry.getAllLabs();
  const userId = req.sessionUser!.userId;
  const userRole = req.sessionUser!.role?.toLowerCase();
  const isInstructor = userRole === 'lecturer' || userRole === 'admin';

  const combined = labs.map((l) => {
    const manifest = manifests.find((m) => m.id === l.id);
    const progressDetails = dbStore.getLabProgressDetails(userId, l.id);
    const status = isInstructor && !l.isUnlocked
      ? (progressDetails.status === 'Locked' ? 'Available' : progressDetails.status)
      : progressDetails.status;

    return {
      ...l,
      shortDescription: manifest?.shortDescription || l.description,
      estimatedDuration: manifest?.estimatedDuration || '3 hours',
      week: manifest?.week || l.labNumber,
      features: manifest?.features || { visualDesigner: true, blockly: true, reportEditor: true },
      progressPercentage: progressDetails.progressPercentage,
      completedTasks: progressDetails.completedTasks,
      totalTasks: progressDetails.totalTasks,
      tasks: progressDetails.tasks,
      status,
      isSubmitted: progressDetails.isSubmitted,
      submittedAt: progressDetails.submittedAt,
      lastOpenedAt: dbStore.getProgress(userId, l.id).lastOpenedAt,
    };
  });

  return res.json({ labs: combined });
});

// GET /api/labs/:id/progress
app.get('/api/labs/:id/progress', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const labId = req.params.id;
  const lab = dbStore.getLabById(labId);
  if (!lab) {
    return res.status(404).json({ error: 'Laboratory not found.' });
  }

  const targetStudentId = (req.query.studentId as string) || req.sessionUser!.userId;
  const userRole = req.sessionUser!.role?.toLowerCase();
  const isInstructor = userRole === 'lecturer' || userRole === 'admin';

  if (targetStudentId !== req.sessionUser!.userId && !isInstructor) {
    return res.status(403).json({ error: 'Unauthorized to view another student\'s lab progress.' });
  }

  const details = dbStore.getLabProgressDetails(targetStudentId, labId);
  return res.json(details);
});

// POST /api/labs/:id/test-run
app.post('/api/labs/:id/test-run', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const labId = req.params.id;
  const { total, passed, results } = req.body;
  const tr = dbStore.saveTestRun(req.sessionUser!.userId, labId, total || 0, passed || 0, results || []);
  dbStore.updateProgress(req.sessionUser!.userId, labId, {
    progressPercentage: Math.min(80, Math.max(dbStore.getProgress(req.sessionUser!.userId, labId).progressPercentage || 0, 70)),
  });
  return res.json({ success: true, testRun: tr });
});

// GET /api/labs/:id
app.get('/api/labs/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const labId = req.params.id;
  const lab = dbStore.getLabById(labId);
  const manifest = LabRegistry.getLab(labId);

  if (!lab || !manifest) {
    return res.status(404).json({ error: 'Laboratory module not found.' });
  }

  const userRole = req.sessionUser!.role?.toLowerCase();
  const isInstructor = userRole === 'lecturer' || userRole === 'admin';
  const isPreview = req.query.preview === 'true' && isInstructor;

  // STRICT SERVER-SIDE AUTHORIZATION: Locked lab protection
  if (!lab.isUnlocked && !isInstructor) {
    return res.status(403).json({
      error: 'Laboratory is currently locked by the lecturer. Access is forbidden until the module is unlocked.',
      locked: true,
      labNumber: lab.labNumber,
      title: lab.title,
    });
  }

  // Record opened progress if student
  if (req.sessionUser!.role?.toLowerCase() === 'student') {
    dbStore.updateProgress(req.sessionUser!.userId, labId, {
      lastOpenedAt: new Date().toISOString(),
      status: 'In Progress',
    });
  }

  return res.json({
    lab,
    manifest,
    isInstructorPreview: isPreview,
  });
});

// PATCH /api/lecturer/labs/:id
app.patch('/api/lecturer/labs/:id', requireLecturerOrAdmin, (req: Request, res: Response) => {
  const labId = req.params.id;
  const { isUnlocked, isPublished, deadline, examMode } = req.body;

  try {
    const updated = dbStore.updateLabStatus(labId, {
      ...(typeof isUnlocked === 'boolean' ? { isUnlocked } : {}),
      ...(typeof isPublished === 'boolean' ? { isPublished } : {}),
      ...(deadline !== undefined ? { deadline } : {}),
      ...(typeof examMode === 'boolean' ? { examMode } : {}),
    });
    return res.json({ success: true, lab: updated });
  } catch (err: any) {
    return res.status(404).json({ error: err.message });
  }
});

// ==========================================
// 3. WORKSPACE (CODE FILES)
// ==========================================

// GET /api/workspaces/:labId
app.get('/api/workspaces/:labId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const labId = req.params.labId;
  const targetStudentId = (req.query.studentId as string) || req.sessionUser!.userId;

  // Authorization check: only own workspace or instructor viewing student
  const userRole = req.sessionUser!.role?.toLowerCase();
  const isInstructor = userRole === 'lecturer' || userRole === 'admin';
  if (targetStudentId !== req.sessionUser!.userId && !isInstructor) {
    return res.status(403).json({ error: 'Cannot access another student\'s workspace.' });
  }

  const existingWs = dbStore.getWorkspace(targetStudentId, labId);
  if (existingWs) {
    return res.json({ files: existingWs.files, updatedAt: existingWs.updatedAt });
  }

  // Load default starter files from manifest
  const manifest = LabRegistry.getLab(labId);
  const defaultFiles = manifest?.starterFiles || [
    { name: 'main.py', language: 'python', content: '# Enter your solution here\n' },
  ];

  return res.json({ files: defaultFiles, updatedAt: null });
});

// POST /api/workspaces/:labId
app.post('/api/workspaces/:labId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const labId = req.params.labId;
  const { files } = req.body;

  if (!Array.isArray(files)) {
    return res.status(400).json({ error: 'Invalid files payload.' });
  }

  const ws = dbStore.saveWorkspace(req.sessionUser!.userId, labId, files);
  dbStore.updateProgress(req.sessionUser!.userId, labId, {
    status: 'In Progress',
    progressPercentage: Math.min(60, (dbStore.getProgress(req.sessionUser!.userId, labId).progressPercentage || 0) + 10),
  });

  return res.json({ success: true, updatedAt: ws.updatedAt });
});

// ==========================================
// 4. VISUAL DESIGN (REACT FLOW / BLOCKLY)
// ==========================================

// GET /api/visual-designs/:labId
app.get('/api/visual-designs/:labId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const labId = req.params.labId;
  const targetStudentId = (req.query.studentId as string) || req.sessionUser!.userId;

  const userRole = req.sessionUser!.role?.toLowerCase();
  const isInstructor = userRole === 'lecturer' || userRole === 'admin';
  if (targetStudentId !== req.sessionUser!.userId && !isInstructor) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  const vd = dbStore.getVisualDesign(targetStudentId, labId);
  if (vd) {
    return res.json({ designType: vd.designType, state: vd.stateJson });
  }

  const manifest = LabRegistry.getLab(labId);
  return res.json({
    designType: 'react-flow',
    state: manifest?.visualDesign || { nodes: [], edges: [] },
  });
});

// POST /api/visual-designs/:labId
app.post('/api/visual-designs/:labId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const labId = req.params.labId;
  const { designType, state } = req.body;

  const vd = dbStore.saveVisualDesign(req.sessionUser!.userId, labId, designType || 'react-flow', state);
  return res.json({ success: true, updatedAt: vd.updatedAt });
});

// ==========================================
// 5. REPORT WORKSPACE & CHECKPOINTS
// ==========================================

// GET /api/reports/:labId
app.get('/api/reports/:labId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const labId = req.params.labId;
  const targetStudentId = (req.query.studentId as string) || req.sessionUser!.userId;

  const userRole = req.sessionUser!.role?.toLowerCase();
  const isInstructor = userRole === 'lecturer' || userRole === 'admin';
  if (targetStudentId !== req.sessionUser!.userId && !isInstructor) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  const rep = dbStore.getReport(targetStudentId, labId);
  if (rep) {
    return res.json({ report: rep });
  }

  const manifest = LabRegistry.getLab(labId);
  const template = manifest?.reportTemplate || {
    title: `${manifest?.title || 'Lab'} Report`,
    sections: [
      { id: 'objective', title: '1. Objective', required: true },
      { id: 'methodology', title: '2. Methodology', required: true },
      { id: 'results', title: '3. Results', required: true },
      { id: 'discussion', title: '4. Discussion', required: true },
      { id: 'conclusion', title: '5. Conclusion', required: true },
    ],
  };

  const initialContent = {
    title: template.title,
    sections: template.sections.map((s) => ({
      id: s.id,
      title: s.title,
      content: '',
      codeSnapshots: [],
      images: [],
    })),
  };

  return res.json({
    report: {
      id: null,
      studentId: targetStudentId,
      labId,
      title: template.title,
      contentJson: initialContent,
      updatedAt: null,
    },
  });
});

// POST /api/reports/:labId
app.post('/api/reports/:labId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const labId = req.params.labId;
  const { title, contentJson } = req.body;

  const rep = dbStore.saveReport(req.sessionUser!.userId, labId, title || 'Lab Report', contentJson);
  dbStore.updateProgress(req.sessionUser!.userId, labId, {
    progressPercentage: Math.min(85, (dbStore.getProgress(req.sessionUser!.userId, labId).progressPercentage || 0) + 15),
  });

  return res.json({ success: true, updatedAt: rep.updatedAt });
});

// Checkpoints
app.get('/api/checkpoints/:labId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const list = dbStore.getCheckpoints(req.sessionUser!.userId, req.params.labId);
  return res.json({ checkpoints: list });
});

app.post('/api/checkpoints/:labId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { label, snapshot } = req.body;
  const cp = dbStore.createCheckpoint(req.sessionUser!.userId, req.params.labId, label || 'Manual Checkpoint', snapshot);
  return res.json({ success: true, checkpoint: cp });
});

// ==========================================
// 6. SCREENSHOT & EVIDENCE UPLOAD
// ==========================================

app.post('/api/storage/upload', requireAuth, async (req: Request, res: Response) => {
  try {
    const { base64Data, fileName, contentType } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'No image data provided.' });
    }

    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    // Validation: 10MB limit
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds 10MB maximum limit.' });
    }

    const storage = getStorageProvider();
    const result = await storage.uploadFile(buffer, fileName || 'evidence.png', contentType || 'image/png');

    return res.json({ url: result.url, key: result.key, size: result.size });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'File upload failed.' });
  }
});

// ==========================================
// 7. SUBMISSIONS (IMMUTABLE ASSESSMENT RECORD)
// ==========================================

// POST /api/submissions/:labId
app.post('/api/submissions/:labId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const labId = req.params.labId;
  const student = dbStore.getUserById(req.sessionUser!.userId);
  const lab = dbStore.getLabById(labId);

  if (!lab) {
    return res.status(404).json({ error: 'Lab record not found.' });
  }

  const { reportSnapshot, codeSnapshot, visualDesignSnapshot, testResultsSnapshot, studentName, studentId } = req.body;
  const resolvedName = studentName?.trim() || reportSnapshot?.studentName?.trim() || student?.name || 'Student';
  const resolvedCode = studentId?.trim() || reportSnapshot?.studentId?.trim() || student?.studentId || 'Open';
  const resolvedEmail = student?.email || 'open@mai5124.academic';

  const sub = dbStore.createSubmission({
    studentId: student ? student.id : req.sessionUser!.userId,
    labId,
    studentName: resolvedName,
    studentEmail: resolvedEmail,
    studentCode: resolvedCode,
    reportSnapshot: reportSnapshot || {},
    codeSnapshot: codeSnapshot || [],
    visualDesignSnapshot: visualDesignSnapshot || {},
    testResultsSnapshot: testResultsSnapshot || { total: 0, passed: 0 },
  });

  return res.json({ success: true, submission: sub });
});

// GET /api/submissions/:labId
app.get('/api/submissions/:labId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const labId = req.params.labId;
  const userRole = req.sessionUser!.role?.toLowerCase();
  const isInstructor = userRole === 'lecturer' || userRole === 'admin';

  if (isInstructor) {
    const all = dbStore.getSubmissionsForLab(labId);
    return res.json({ submissions: all });
  } else {
    const own = dbStore.getSubmission(req.sessionUser!.userId, labId);
    return res.json({ submission: own || null });
  }
});

// ==========================================
// 8. DOCX GENERATION & DOWNLOAD
// ==========================================

// GET /api/reports/:labId/docx
app.post('/api/reports/:labId/docx', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const labId = req.params.labId;
    const lab = dbStore.getLabById(labId);
    const studentUser = dbStore.getUserById(req.body.studentId || req.sessionUser!.userId);

    if (!lab) {
      return res.status(404).json({ error: 'Laboratory not found.' });
    }

    const { reportData } = req.body;
    const sections = reportData?.sections || [];
    const resolvedName = reportData?.studentName?.trim() || studentUser?.name || 'Student';
    const resolvedCode = reportData?.studentId?.trim() || studentUser?.studentId || '';
    const resolvedEmail = studentUser?.email || '';

    const blob = await generateDocxReport({
      courseCode: 'MAI5124',
      courseTitle: 'AI in Software Engineering',
      labNumber: lab.labNumber,
      labTitle: lab.title,
      studentName: resolvedName,
      studentId: resolvedCode,
      studentEmail: resolvedEmail,
      submissionDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      sections,
    });

    const buffer = Buffer.from(await blob.arrayBuffer());
    const cleanStudentName = resolvedName.replace(/[^a-zA-Z0-9]/g, '_') || 'Student';
    const cleanStudentId = resolvedCode.replace(/[^a-zA-Z0-9]/g, '_') || 'Submission';
    const filename = `MAI5124_Lab${String(lab.labNumber).padStart(2, '0')}_${cleanStudentId}_${cleanStudentName}.docx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (err: any) {
    console.error('Docx generation error:', err);
    return res.status(500).json({ error: 'Failed to generate Word report document.' });
  }
});

// ==========================================
// 9. LECTURER ROSTER & BULK EXPORT
// ==========================================

// GET /api/lecturer/students
app.get('/api/lecturer/students', requireLecturerOrAdmin, (_req: Request, res: Response) => {
  const students = dbStore.getStudents();
  const labs = dbStore.getLabs();

  const studentList = students.map((s) => {
    const labProgressMap: Record<string, any> = {};
    labs.forEach((l) => {
      const prog = dbStore.getProgress(s.id, l.id);
      const sub = dbStore.getSubmission(s.id, l.id);
      labProgressMap[l.id] = {
        status: sub ? 'Submitted' : prog.status,
        progress: sub ? 100 : prog.progressPercentage,
        submittedAt: sub?.submittedAt,
        hasSubmission: Boolean(sub),
      };
    });

    return {
      id: s.id,
      name: s.name,
      email: s.email,
      studentId: s.studentId,
      createdAt: s.createdAt,
      labs: labProgressMap,
    };
  });

  return res.json({ students: studentList });
});

// POST /api/lecturer/students (Manual Add)
app.post('/api/lecturer/students', requireLecturerOrAdmin, (req: Request, res: Response) => {
  const { name, email, studentId } = req.body;
  if (!name || !email || !studentId) {
    return res.status(400).json({ error: 'Name, email, and student ID are required.' });
  }

  try {
    const student = dbStore.createUser({
      name,
      email,
      studentId,
      role: 'student',
      passwordPlain: studentId, // Initial password is the Student ID without forced change
    });
    return res.json({ success: true, student: toPublicUser(student) });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/lecturer/students/import-csv
app.post('/api/lecturer/students/import-csv', requireLecturerOrAdmin, (req: Request, res: Response) => {
  const { csvText } = req.body;
  if (!csvText || typeof csvText !== 'string') {
    return res.status(400).json({ error: 'CSV data is required.' });
  }

  const lines = csvText.trim().split('\n');
  const results: any[] = [];
  const errors: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    // Skip header line if detected
    if (i === 0 && line.toLowerCase().includes('email') && line.toLowerCase().includes('name')) {
      continue;
    }

    const parts = line.split(',').map((p) => p.trim());
    if (parts.length < 3) {
      errors.push(`Row ${i + 1}: Insufficient columns. Expected: Name, Student ID, Email`);
      continue;
    }

    const [name, studentId, email] = parts;
    try {
      const student = dbStore.createUser({
        name,
        email,
        studentId,
        role: 'student',
        passwordPlain: studentId, // Initial password is the Student ID
      });
      results.push(toPublicUser(student));
    } catch (err: any) {
      errors.push(`Row ${i + 1} (${email}): ${err.message}`);
    }
  }

  return res.json({
    success: true,
    importedCount: results.length,
    students: results,
    errors,
  });
});

// GET /api/lecturer/labs/:labId/download-all (ZIP Archive)
app.get('/api/lecturer/labs/:labId/download-all', requireLecturerOrAdmin, async (req: Request, res: Response) => {
  try {
    const labId = req.params.labId;
    const lab = dbStore.getLabById(labId);
    if (!lab) {
      return res.status(404).json({ error: 'Laboratory not found.' });
    }

    const submissions = dbStore.getSubmissionsForLab(labId);
    if (submissions.length === 0) {
      return res.status(400).json({ error: 'No student submissions have been recorded for this laboratory yet.' });
    }

    const zipItems = submissions.map((sub) => {
      const reportSnapshot = sub.reportSnapshot || {};
      const sections = reportSnapshot.sections || [];

      return {
        studentId: sub.studentCode || 'STUDENT',
        studentName: sub.studentName || 'Student',
        studentEmail: sub.studentEmail || '',
        labNumber: lab.labNumber,
        labTitle: lab.title,
        reportData: {
          courseCode: 'MAI5124',
          courseTitle: 'AI in Software Engineering',
          labNumber: lab.labNumber,
          labTitle: lab.title,
          studentName: sub.studentName || 'Student',
          studentId: sub.studentCode || 'STUDENT',
          studentEmail: sub.studentEmail,
          submissionDate: new Date(sub.submittedAt).toLocaleDateString('en-GB'),
          sections,
        },
      };
    });

    const zipBlob = await generateSubmissionsZip(labId, lab.title, zipItems);
    const buffer = Buffer.from(await zipBlob.arrayBuffer());
    const zipName = `MAI5124_Lab${String(lab.labNumber).padStart(2, '0')}_All_Submissions.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);
    return res.send(buffer);
  } catch (err: any) {
    console.error('Bulk zip error:', err);
    return res.status(500).json({ error: 'Failed to generate bulk submission archive.' });
  }
});

// ==========================================
// 10. VITE MIDDLEWARE / STATIC ASSETS
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Mount Vite in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AISE Lab Studio] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
