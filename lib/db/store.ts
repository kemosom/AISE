import bcrypt from 'bcryptjs';
import type { UserRole, LabStatus } from './schema';
import { LabRegistry } from '../../labs/registry';
import type { LabTaskItem } from '../../labs/types';

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  studentId?: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface CourseEntity {
  id: string;
  code: string;
  title: string;
  semester: string;
  description: string;
}

export interface LabEntity {
  id: string;
  courseId: string;
  labNumber: number;
  title: string;
  description: string;
  isPublished: boolean;
  isUnlocked: boolean;
  unlockAt?: string;
  deadline?: string;
  examMode: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProgressEntity {
  id: string;
  studentId: string;
  labId: string;
  status: LabStatus;
  lastOpenedAt: string;
  progressPercentage: number;
  updatedAt: string;
}

export interface WorkspaceEntity {
  id: string;
  studentId: string;
  labId: string;
  files: Array<{ name: string; content: string; language: string }>;
  updatedAt: string;
}

export interface VisualDesignEntity {
  id: string;
  studentId: string;
  labId: string;
  designType: 'react-flow' | 'blockly';
  stateJson: any;
  updatedAt: string;
}

export interface TestRunEntity {
  id: string;
  studentId: string;
  labId: string;
  totalTests: number;
  passedTests: number;
  resultsJson: any;
  runAt: string;
}

export interface ReportEntity {
  id: string;
  studentId: string;
  labId: string;
  title: string;
  contentJson: any;
  updatedAt: string;
}

export interface CheckpointEntity {
  id: string;
  studentId: string;
  labId: string;
  label: string;
  snapshotJson: any;
  createdAt: string;
}

export interface SubmissionEntity {
  id: string;
  studentId: string;
  labId: string;
  studentName?: string;
  studentEmail?: string;
  studentCode?: string;
  reportSnapshot: any;
  codeSnapshot: any;
  visualDesignSnapshot: any;
  testResultsSnapshot: any;
  submittedAt: string;
  grade?: string;
  lecturerFeedback?: string;
}

// In-Memory Data Store (Works seamlessly without external DB setup, with instant sync)
class MemoryDataStore {
  private users: Map<string, UserEntity> = new Map();
  private courses: Map<string, CourseEntity> = new Map();
  private labs: Map<string, LabEntity> = new Map();
  private progress: Map<string, StudentProgressEntity> = new Map();
  private workspaces: Map<string, WorkspaceEntity> = new Map();
  private visualDesigns: Map<string, VisualDesignEntity> = new Map();
  private testRuns: Map<string, TestRunEntity> = new Map();
  private reports: Map<string, ReportEntity> = new Map();
  private checkpoints: Map<string, CheckpointEntity[]> = new Map();
  private submissions: Map<string, SubmissionEntity> = new Map();

  private isSeeded = false;

  constructor() {
    this.seed();
  }

  public seed() {
    if (this.isSeeded) return;

    // 1. Admin
    const adminHash = bcrypt.hashSync('admin12345', 10);
    this.users.set('user-admin-1', {
      id: 'user-admin-1',
      name: 'System Administrator',
      email: 'admin@sunway.edu.my',
      role: 'admin',
      passwordHash: adminHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 2. Lecturer
    const lecturerHash = bcrypt.hashSync('lecturer12345', 10);
    this.users.set('user-lecturer-1', {
      id: 'user-lecturer-1',
      name: 'Dr. Aaron Tan',
      email: 'lecturer@sunway.edu.my',
      role: 'lecturer',
      passwordHash: lecturerHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 3. Students - Initial password is student ID
    const s1Hash = bcrypt.hashSync('24012345', 10);
    this.users.set('user-student-1', {
      id: 'user-student-1',
      name: 'Ahmed Ali',
      email: 'student1@imail.sunway.edu.my',
      studentId: '24012345',
      role: 'student',
      passwordHash: s1Hash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const s2Hash = bcrypt.hashSync('24012346', 10);
    this.users.set('user-student-2', {
      id: 'user-student-2',
      name: 'Siti Aminah',
      email: 'student2@imail.sunway.edu.my',
      studentId: '24012346',
      role: 'student',
      passwordHash: s2Hash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const s3Hash = bcrypt.hashSync('24012347', 10);
    this.users.set('user-student-3', {
      id: 'user-student-3',
      name: 'David Chen',
      email: 'student3@imail.sunway.edu.my',
      studentId: '24012347',
      role: 'student',
      passwordHash: s3Hash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Course: MAI5124
    this.courses.set('course-mai5124', {
      id: 'course-mai5124',
      code: 'MAI5124',
      title: 'AI in Software Engineering',
      semester: 'Semester 1, 2026/2027',
      description: 'Master-level interactive software engineering laboratory focusing on AI-assisted behavioral design, intelligent agents, auto-generation, risk testing, and debugging.',
    });

    // 11 Labs + 1 Exam
    const labList = [
      { num: 1, id: 'lab01-behavioral-programming', title: 'AI for Software Design: Behavioral Programming', desc: 'Explore b-thread prioritization, event request/wait-for/block mechanics, and AI conflict coordination.' },
      { num: 2, id: 'lab02-requirement-prioritization', title: 'AI Techniques for Software Requirements Prioritization', desc: 'Implement NLP and machine-learning classifiers to automate software requirement ranking and MOSCOW tagging.' },
      { num: 3, id: 'lab03-social-commitment-agents', title: 'Agent-Based Software Programming: Social Commitments', desc: 'Model multi-agent negotiation, conditional commitments, and communicative speech-acts in software ecosystems.' },
      { num: 4, id: 'lab04-intelligent-agents', title: 'Agent-Based Software Programming: Intelligent Agents', desc: 'Build reactive and deliberate BDI (Belief-Desire-Intention) agents for dynamic software orchestration.' },
      { num: 5, id: 'lab05-artifact-generation', title: 'Automated Software Artifact Generation', desc: 'Synthesize UML diagrams, API stubs, and unit test suites from natural language specifications.' },
      { num: 6, id: 'lab06-software-fusion', title: 'Software Fusion and Design Learning', desc: 'Apply structural graph neural networks to detect code smells and learn architectural patterns.' },
      { num: 7, id: 'lab07-software-auto-generation', title: 'AI-Based Software Auto-Generation for Cyber-Physical Applications', desc: 'Synthesize controller logic and real-time state machines for embedded cyber-physical systems.' },
      { num: 8, id: 'lab08-ai-software-testing', title: 'AI for Software Testing and Machine-Learned Test Oracles', desc: 'Train predictive test oracles and generate edge-case invariant inputs using evolutionary algorithms.' },
      { num: 9, id: 'lab09-risk-based-testing', title: 'Risk-Based Software Testing and Qualitative Reasoning', desc: 'Prioritize test execution paths using qualitative software risk matrices and Bayesian belief networks.' },
      { num: 10, id: 'lab10-spreadsheet-debugging', title: 'AI-Based Spreadsheet Debugging', desc: 'Identify calculation fault patterns, circular dependency anomalies, and semantic cell errors.' },
      { num: 11, id: 'lab11-ai-software-debugging', title: 'Artificial Intelligence Methods for Software Debugging', desc: 'Spectrum-based fault localization (SBFL) and automated repair patch generation.' },
      { num: 12, id: 'exam-code-review', title: 'Practical Examination: AI-Assisted Code Review', desc: 'Timed practical assessment examining critical vulnerability detection and automated patch validation.' }
    ];

    labList.forEach((l) => {
      this.labs.set(l.id, {
        id: l.id,
        courseId: 'course-mai5124',
        labNumber: l.num,
        title: l.title,
        description: l.desc,
        isPublished: true,
        // Only Lab 01 is unlocked by default; lecturer unlocks others
        isUnlocked: l.num === 1,
        unlockAt: l.num === 1 ? new Date().toISOString() : undefined,
        deadline: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
        examMode: l.num === 12,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    // Seed sample progress & submission for Student 3 (David Chen) in Lab 01 to demonstrate lecturer grading/review view
    const s3SubKey = `user-student-3:lab01-behavioral-programming`;
    this.progress.set(s3SubKey, {
      id: `prog-${s3SubKey}`,
      studentId: 'user-student-3',
      labId: 'lab01-behavioral-programming',
      status: 'Submitted',
      lastOpenedAt: new Date().toISOString(),
      progressPercentage: 100,
      updatedAt: new Date().toISOString(),
    });

    this.submissions.set(s3SubKey, {
      id: `sub-${s3SubKey}`,
      studentId: 'user-student-3',
      labId: 'lab01-behavioral-programming',
      studentName: 'David Chen',
      studentEmail: 'student3@imail.sunway.edu.my',
      studentCode: '24012347',
      reportSnapshot: {
        title: 'Lab 01 Technical Report: Behavioral Programming',
        sections: [
          {
            id: 'objective',
            title: '1. Laboratory Objectives',
            content: 'The primary objective of this laboratory is to explore behavioral programming paradigms using independent b-threads and evaluate conflict resolution in concurrent software execution.'
          },
          {
            id: 'methodology',
            title: '2. Theoretical Methodology',
            content: 'Behavioral programming coordinates separate independent execution threads by expressing requirements through requested, waited-for, and blocked events at synchronization yield points.'
          },
          {
            id: 'implementation',
            title: '3. Implementation & B-Thread Design',
            content: 'Implemented three cooperative b-threads: `add_hot_water`, `add_cold_water`, and an emergency `block_overflow` thread that successfully blocked excess filling when container capacity was reached.'
          },
          {
            id: 'results',
            title: '4. Execution Results & Empirical Evidence',
            content: 'Automated test suite ran 4 verification tests. All 4 passed with zero unhandled event deadlocks.'
          },
          {
            id: 'discussion',
            title: '5. Critical Analysis & Answers to Questions',
            content: 'The b-thread approach decouples requirement specifications, allowing safety rules (blocking invariants) to be added without modifying existing positive scenario threads.'
          },
          {
            id: 'conclusion',
            title: '6. Conclusion & Future Refinements',
            content: 'The laboratory verified that reactive conflict coordination eliminates monolithic state machines in complex concurrent software architectures.'
          }
        ]
      },
      codeSnapshot: [
        {
          name: 'main.py',
          language: 'python',
          content: `# Behavioral Programming Reference Implementation\nfrom helpers import BProgram, Event\n\ndef add_water_thread():\n    for _ in range(5):\n        yield {'request': 'ADD_WATER', 'waitFor': [], 'block': []}\n\ndef safety_monitor():\n    yield {'waitFor': ['ADD_WATER'], 'block': ['DRAIN_VALVE']}\n\nif __name__ == '__main__':\n    bp = BProgram()\n    bp.add_bthread(add_water_thread)\n    bp.add_bthread(safety_monitor)\n    bp.run()\n    print("All behavioral threads executed smoothly.")\n`
        }
      ],
      visualDesignSnapshot: {
        nodes: [
          { id: '1', type: 'input', data: { label: 'B-Thread: Water Producer' }, position: { x: 100, y: 100 } },
          { id: '2', type: 'default', data: { label: 'Sync Coordinator (RWB Arbiter)' }, position: { x: 350, y: 150 } },
          { id: '3', type: 'output', data: { label: 'Event Dispatch: ADD_WATER' }, position: { x: 600, y: 150 } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2', label: 'request' },
          { id: 'e2-3', source: '2', target: '3', label: 'dispatched' }
        ]
      },
      testResultsSnapshot: {
        total: 4,
        passed: 4,
        details: [
          { name: 'Sync Invariant Test', passed: true, message: 'RWB synchronization protocol validated.' },
          { name: 'Block Precedence Test', passed: true, message: 'Blocked events never dispatched.' },
          { name: 'Deadlock Freedom Test', passed: true, message: 'No cyclic dependency detected.' },
          { name: 'Output Verification', passed: true, message: 'State log matches expected behavioral trace.' }
        ]
      },
      submittedAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
      grade: 'A',
      lecturerFeedback: 'Excellent implementation of the safety arbiter and clear technical discussion.'
    });

    this.isSeeded = true;
  }

  // User Operations
  getUserById(id: string): UserEntity | undefined {
    return this.users.get(id);
  }

  getUserByEmail(email: string): UserEntity | undefined {
    const norm = email.trim().toLowerCase();
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === norm) return u;
    }
    return undefined;
  }

  getUsers(): UserEntity[] {
    return Array.from(this.users.values());
  }

  getStudents(): UserEntity[] {
    return Array.from(this.users.values()).filter(
      (u) => u.role.toLowerCase() === 'student'
    );
  }

  createUser(userData: {
    name: string;
    email: string;
    studentId?: string;
    role?: UserRole;
    passwordPlain?: string;
  }): UserEntity {
    const existing = this.getUserByEmail(userData.email);
    if (existing) {
      throw new Error(`User with email ${userData.email} already exists`);
    }
    const id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const pass = userData.passwordPlain || userData.studentId || '24012345';
    const passwordHash = bcrypt.hashSync(pass, 10);
    const user: UserEntity = {
      id,
      name: userData.name,
      email: userData.email.trim().toLowerCase(),
      studentId: userData.studentId,
      role: userData.role || 'student',
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(id, user);
    return user;
  }

  updateUserPassword(userId: string, newPasswordPlain: string): void {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    user.passwordHash = bcrypt.hashSync(newPasswordPlain, 10);
    user.updatedAt = new Date().toISOString();
  }

  // Course Operations
  getCourses(): CourseEntity[] {
    return Array.from(this.courses.values());
  }

  // Lab Operations
  getLabs(): LabEntity[] {
    return Array.from(this.labs.values()).sort((a, b) => a.labNumber - b.labNumber);
  }

  getLabById(id: string): LabEntity | undefined {
    return this.labs.get(id);
  }

  updateLabStatus(labId: string, updates: Partial<LabEntity>): LabEntity {
    const lab = this.labs.get(labId);
    if (!lab) throw new Error(`Lab ${labId} not found`);
    const updated = { ...lab, ...updates, updatedAt: new Date().toISOString() };
    this.labs.set(labId, updated);
    return updated;
  }

  // Progress
  getProgress(studentId: string, labId: string): StudentProgressEntity {
    const key = `${studentId}:${labId}`;
    let p = this.progress.get(key);
    if (!p) {
      const lab = this.labs.get(labId);
      const isUn = lab?.isUnlocked ?? false;
      p = {
        id: `prog-${key}`,
        studentId,
        labId,
        status: isUn ? 'Available' : 'Locked',
        lastOpenedAt: new Date().toISOString(),
        progressPercentage: 0,
        updatedAt: new Date().toISOString(),
      };
      this.progress.set(key, p);
    }
    return p;
  }

  updateProgress(studentId: string, labId: string, updates: Partial<StudentProgressEntity>): StudentProgressEntity {
    const key = `${studentId}:${labId}`;
    const cur = this.getProgress(studentId, labId);
    const updated = { ...cur, ...updates, updatedAt: new Date().toISOString() };
    this.progress.set(key, updated);
    return updated;
  }

  // Workspace
  getWorkspace(studentId: string, labId: string): WorkspaceEntity | undefined {
    return this.workspaces.get(`${studentId}:${labId}`);
  }

  saveWorkspace(studentId: string, labId: string, files: Array<{ name: string; content: string; language: string }>): WorkspaceEntity {
    const key = `${studentId}:${labId}`;
    const ws: WorkspaceEntity = {
      id: `ws-${key}`,
      studentId,
      labId,
      files,
      updatedAt: new Date().toISOString(),
    };
    this.workspaces.set(key, ws);
    return ws;
  }

  // Visual Design
  getVisualDesign(studentId: string, labId: string): VisualDesignEntity | undefined {
    return this.visualDesigns.get(`${studentId}:${labId}`);
  }

  saveVisualDesign(studentId: string, labId: string, designType: 'react-flow' | 'blockly', stateJson: any): VisualDesignEntity {
    const key = `${studentId}:${labId}`;
    const vd: VisualDesignEntity = {
      id: `vd-${key}`,
      studentId,
      labId,
      designType,
      stateJson,
      updatedAt: new Date().toISOString(),
    };
    this.visualDesigns.set(key, vd);
    return vd;
  }

  // Reports
  getReport(studentId: string, labId: string): ReportEntity | undefined {
    return this.reports.get(`${studentId}:${labId}`);
  }

  saveReport(studentId: string, labId: string, title: string, contentJson: any): ReportEntity {
    const key = `${studentId}:${labId}`;
    const rep: ReportEntity = {
      id: `rep-${key}`,
      studentId,
      labId,
      title,
      contentJson,
      updatedAt: new Date().toISOString(),
    };
    this.reports.set(key, rep);
    return rep;
  }

  // Checkpoints
  getCheckpoints(studentId: string, labId: string): CheckpointEntity[] {
    return this.checkpoints.get(`${studentId}:${labId}`) || [];
  }

  createCheckpoint(studentId: string, labId: string, label: string, snapshotJson: any): CheckpointEntity {
    const key = `${studentId}:${labId}`;
    const list = this.checkpoints.get(key) || [];
    const cp: CheckpointEntity = {
      id: `cp-${Date.now()}`,
      studentId,
      labId,
      label,
      snapshotJson,
      createdAt: new Date().toISOString(),
    };
    list.unshift(cp);
    this.checkpoints.set(key, list);
    return cp;
  }

  // Test Runs
  saveTestRun(studentId: string, labId: string, totalTests: number, passedTests: number, resultsJson: any): TestRunEntity {
    const key = `${studentId}:${labId}`;
    const tr: TestRunEntity = {
      id: `tr-${Date.now()}`,
      studentId,
      labId,
      totalTests,
      passedTests,
      resultsJson,
      runAt: new Date().toISOString(),
    };
    this.testRuns.set(key, tr);
    return tr;
  }

  getTestRun(studentId: string, labId: string): TestRunEntity | undefined {
    return this.testRuns.get(`${studentId}:${labId}`);
  }

  // Comprehensive Lab Progress & Task Status Computation
  getLabProgressDetails(studentId: string, labId: string) {
    const lab = this.labs.get(labId);
    const isUnlocked = lab?.isUnlocked ?? false;
    const submission = this.getSubmission(studentId, labId);
    const progress = this.getProgress(studentId, labId);
    const workspace = this.getWorkspace(studentId, labId);
    const visualDesign = this.getVisualDesign(studentId, labId);
    const report = this.getReport(studentId, labId);
    const testRun = this.getTestRun(studentId, labId);

    const taskDefs = LabRegistry.getLabTasks(labId);
    const totalTasks = taskDefs.length;

    // 1. SUBMISSION RECORDED -> 100% COMPLETE ALL TASKS
    if (submission) {
      const tasks = taskDefs.map((t) => ({ ...t, completed: true }));
      return {
        labId,
        labNumber: lab?.labNumber || 1,
        title: lab?.title || '',
        status: 'Submitted' as const,
        isUnlocked: true,
        isSubmitted: true,
        submittedAt: submission.submittedAt,
        completedTasks: totalTasks,
        totalTasks,
        progressPercentage: 100,
        tasks,
      };
    }

    // 2. LOCKED LAB -> 0% ALL TASKS PENDING
    if (!isUnlocked) {
      const tasks = taskDefs.map((t) => ({ ...t, completed: false }));
      return {
        labId,
        labNumber: lab?.labNumber || 1,
        title: lab?.title || '',
        status: 'Locked' as const,
        isUnlocked: false,
        isSubmitted: false,
        submittedAt: null,
        completedTasks: 0,
        totalTasks,
        progressPercentage: 0,
        tasks,
      };
    }

    // 3. AVAILABLE OR IN PROGRESS LAB -> EVALUATE TASK COMPLETION
    const hasWorkspaceCode = !!(workspace && workspace.files && workspace.files.length > 0 && workspace.files.some(f => f.content && f.content.trim().length > 50));
    const hasEditedCode = !!(workspace && workspace.updatedAt) || progress.progressPercentage >= 20;
    const hasSubstantialCode = hasWorkspaceCode && (workspace!.files.some(f => f.content.length > 300) || progress.progressPercentage >= 40);
    const hasDesign = !!(visualDesign && visualDesign.updatedAt) || progress.progressPercentage >= 50;
    const hasPassedTests = (testRun && testRun.passedTests > 0) || progress.progressPercentage >= 70;
    const hasReport = !!(report && report.contentJson && report.contentJson.sections && report.contentJson.sections.some((s: any) => s.content && s.content.trim().length > 20)) || progress.progressPercentage >= 85;

    const tasks = taskDefs.map((task, index) => {
      let completed = false;
      if (task.category === 'code') {
        if (index === 0) {
          completed = hasEditedCode || hasWorkspaceCode || progress.progressPercentage > 0;
        } else {
          completed = hasSubstantialCode;
        }
      } else if (task.category === 'design') {
        completed = hasDesign;
      } else if (task.category === 'test') {
        completed = hasPassedTests;
      } else if (task.category === 'submission') {
        completed = false; // not yet submitted
      } else if (task.category === 'report') {
        completed = hasReport;
      } else {
        completed = (index + 1) <= Math.floor((progress.progressPercentage / 100) * totalTasks);
      }

      return {
        ...task,
        completed,
      };
    });

    const completedTasks = tasks.filter((t) => t.completed).length;
    const progressPercentage = Math.round((completedTasks / totalTasks) * 100);
    const status = completedTasks > 0 ? ('In Progress' as const) : ('Available' as const);

    return {
      labId,
      labNumber: lab?.labNumber || 1,
      title: lab?.title || '',
      status,
      isUnlocked: true,
      isSubmitted: false,
      submittedAt: null,
      completedTasks,
      totalTasks,
      progressPercentage,
      tasks,
    };
  }

  // Submissions
  getSubmissionsForLab(labId: string): SubmissionEntity[] {
    const res: SubmissionEntity[] = [];
    for (const sub of this.submissions.values()) {
      if (sub.labId === labId) {
        res.push(sub);
      }
    }
    return res;
  }

  getSubmission(studentId: string, labId: string): SubmissionEntity | undefined {
    return this.submissions.get(`${studentId}:${labId}`);
  }

  createSubmission(submission: Omit<SubmissionEntity, 'id' | 'submittedAt'>): SubmissionEntity {
    const key = `${submission.studentId}:${submission.labId}`;
    const sub: SubmissionEntity = {
      ...submission,
      id: `sub-${Date.now()}`,
      submittedAt: new Date().toISOString(),
    };
    this.submissions.set(key, sub);
    this.updateProgress(submission.studentId, submission.labId, {
      status: 'Submitted',
      progressPercentage: 100,
    });
    return sub;
  }
}

// Global Singleton Store
const globalStoreKey = '__AISE_LAB_STUDIO_STORE__';
declare global {
  var __AISE_LAB_STUDIO_STORE__: MemoryDataStore | undefined;
}

if (!global[globalStoreKey]) {
  global[globalStoreKey] = new MemoryDataStore();
}

export const dbStore = global[globalStoreKey]!;
