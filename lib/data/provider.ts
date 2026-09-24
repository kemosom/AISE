import {
  dbStore,
  type UserEntity,
  type LabEntity,
  type StudentProgressEntity,
  type SubmissionEntity,
} from '../db/store';
import { isSupabaseServerConfigured, createSupabaseServerClient } from '../supabase/server';
import type { LabTaskItem } from '../../labs/types';

export interface DataProvider {
  readonly mode: 'supabase' | 'demo';

  // Auth & Users
  getUserByEmail(email: string): Promise<UserEntity | null>;
  getUserById(id: string): Promise<UserEntity | null>;
  updateUserPassword(userId: string, newPasswordPlain: string): Promise<void>;
  listStudents(): Promise<UserEntity[]>;
  createStudent(student: { name: string; studentId: string; email: string; passwordPlain?: string }): Promise<UserEntity>;

  // Labs
  getLabs(): Promise<LabEntity[]>;
  getLabById(id: string): Promise<LabEntity | null>;
  updateLab(id: string, updates: Partial<LabEntity>): Promise<LabEntity | null>;

  // Progress
  getProgress(userId: string, labId: string): Promise<StudentProgressEntity>;
  getLabProgressDetails(userId: string, labId: string): Promise<{
    progressPercentage: number;
    completedTasks: number;
    totalTasks: number;
    status: string;
    tasks: LabTaskItem[];
    isSubmitted: boolean;
    submittedAt?: string | null;
  }>;
  recordTestRun(userId: string, labId: string, passed: number, total: number): Promise<void>;

  // Workspaces
  getWorkspace(userId: string, labId: string): Promise<{ files: Array<{ name: string; language: string; content: string }> } | null>;
  saveWorkspace(userId: string, labId: string, files: Array<{ name: string; language: string; content: string }>): Promise<void>;

  // Visual Designs
  getVisualDesign(userId: string, labId: string): Promise<{ designType: 'react-flow' | 'blockly'; state: any } | null>;
  saveVisualDesign(userId: string, labId: string, designType: 'react-flow' | 'blockly', state: any): Promise<void>;

  // Reports
  getReport(userId: string, labId: string): Promise<{ title: string; contentJson: any; updatedAt?: string } | null>;
  saveReport(userId: string, labId: string, title: string, contentJson: any): Promise<void>;

  // Checkpoints
  getCheckpoints(userId: string, labId: string): Promise<any[]>;
  createCheckpoint(userId: string, labId: string, label: string, snapshot: any): Promise<any>;

  // Submissions
  createSubmission(submission: {
    studentId: string;
    studentName: string;
    studentCode: string;
    labId: string;
    reportSnapshot: any;
    codeSnapshot: any[];
    visualDesignSnapshot: any;
    testResultsSnapshot: any;
  }): Promise<SubmissionEntity>;
  getSubmission(studentId: string, labId: string): Promise<SubmissionEntity | null>;
  getSubmissionsForLab(labId: string): Promise<SubmissionEntity[]>;
}

/**
 * MemoryDataProvider: Active during development & AI Studio Preview.
 * In-memory persistence that enables complete testing of all laboratories without external database credentials.
 */
export class MemoryDataProvider implements DataProvider {
  readonly mode = 'demo' as const;

  async getUserByEmail(email: string): Promise<UserEntity | null> {
    return dbStore.getUserByEmail(email) || null;
  }

  async getUserById(id: string): Promise<UserEntity | null> {
    return dbStore.getUserById(id) || null;
  }

  async updateUserPassword(userId: string, newPasswordPlain: string): Promise<void> {
    dbStore.updateUserPassword(userId, newPasswordPlain);
  }

  async listStudents(): Promise<UserEntity[]> {
    return dbStore.getStudents();
  }

  async createStudent(student: { name: string; studentId: string; email: string; passwordPlain?: string }): Promise<UserEntity> {
    return dbStore.createUser({
      name: student.name,
      studentId: student.studentId,
      email: student.email,
      passwordPlain: student.passwordPlain || student.studentId,
      role: 'student',
    });
  }

  async getLabs(): Promise<LabEntity[]> {
    return dbStore.getLabs();
  }

  async getLabById(id: string): Promise<LabEntity | null> {
    return dbStore.getLabById(id) || null;
  }

  async updateLab(id: string, updates: Partial<LabEntity>): Promise<LabEntity | null> {
    return dbStore.updateLabStatus(id, updates);
  }

  async getProgress(userId: string, labId: string): Promise<StudentProgressEntity> {
    return dbStore.getProgress(userId, labId);
  }

  async getLabProgressDetails(userId: string, labId: string) {
    const details = dbStore.getLabProgressDetails(userId, labId);
    return {
      progressPercentage: details.progressPercentage,
      completedTasks: details.completedTasks,
      totalTasks: details.totalTasks,
      status: details.status,
      tasks: details.tasks,
      isSubmitted: details.isSubmitted,
      submittedAt: details.submittedAt,
    };
  }

  async recordTestRun(userId: string, labId: string, passed: number, total: number): Promise<void> {
    dbStore.saveTestRun(userId, labId, total, passed, []);
  }

  async getWorkspace(userId: string, labId: string) {
    const ws = dbStore.getWorkspace(userId, labId);
    if (!ws) return null;
    return { files: ws.files };
  }

  async saveWorkspace(userId: string, labId: string, files: Array<{ name: string; language: string; content: string }>) {
    dbStore.saveWorkspace(userId, labId, files);
  }

  async getVisualDesign(userId: string, labId: string) {
    const vd = dbStore.getVisualDesign(userId, labId);
    if (!vd) return null;
    return { designType: vd.designType, state: vd.stateJson };
  }

  async saveVisualDesign(userId: string, labId: string, designType: 'react-flow' | 'blockly', state: any) {
    dbStore.saveVisualDesign(userId, labId, designType, state);
  }

  async getReport(userId: string, labId: string) {
    const rep = dbStore.getReport(userId, labId);
    if (!rep) return null;
    return { title: rep.title, contentJson: rep.contentJson, updatedAt: rep.updatedAt };
  }

  async saveReport(userId: string, labId: string, title: string, contentJson: any) {
    dbStore.saveReport(userId, labId, title, contentJson);
  }

  async getCheckpoints(userId: string, labId: string) {
    return dbStore.getCheckpoints(userId, labId);
  }

  async createCheckpoint(userId: string, labId: string, label: string, snapshot: any) {
    return dbStore.createCheckpoint(userId, labId, label, snapshot);
  }

  async createSubmission(submission: any) {
    return dbStore.createSubmission(submission);
  }

  async getSubmission(studentId: string, labId: string) {
    return dbStore.getSubmission(studentId, labId) || null;
  }

  async getSubmissionsForLab(labId: string) {
    return dbStore.getSubmissionsForLab(labId);
  }
}

/**
 * SupabaseDataProvider: Active in production when NEXT_PUBLIC_SUPABASE_URL
 * and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are supplied.
 */
export class SupabaseDataProvider implements DataProvider {
  readonly mode = 'supabase' as const;

  private getClient() {
    const client = createSupabaseServerClient();
    if (!client) {
      throw new Error('Supabase client is not configured.');
    }
    return client;
  }

  async getUserByEmail(email: string): Promise<UserEntity | null> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      name: data.full_name || data.name || 'User',
      studentId: data.student_id,
      email: data.email,
      passwordHash: data.password_hash || '',
      role: data.role || 'student',
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || new Date().toISOString(),
    };
  }

  async getUserById(id: string): Promise<UserEntity | null> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      name: data.full_name || data.name || 'User',
      studentId: data.student_id,
      email: data.email,
      passwordHash: data.password_hash || '',
      role: data.role || 'student',
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || new Date().toISOString(),
    };
  }

  async updateUserPassword(userId: string, newPasswordPlain: string): Promise<void> {
    const supabase = this.getClient();
    await supabase
      .from('profiles')
      .update({ password_plain: newPasswordPlain, updated_at: new Date().toISOString() })
      .eq('id', userId);
  }

  async listStudents(): Promise<UserEntity[]> {
    const supabase = this.getClient();
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('student_id', { ascending: true });

    if (!data) return [];
    return data.map((d: any) => ({
      id: d.id,
      name: d.full_name || d.name,
      studentId: d.student_id,
      email: d.email,
      passwordHash: '',
      role: 'student',
      createdAt: d.created_at || new Date().toISOString(),
      updatedAt: d.updated_at || new Date().toISOString(),
    }));
  }

  async createStudent(student: { name: string; studentId: string; email: string; passwordPlain?: string }): Promise<UserEntity> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        name: student.name,
        full_name: student.name,
        student_id: student.studentId,
        email: student.email.toLowerCase().trim(),
        password_plain: student.passwordPlain || student.studentId,
        role: 'student',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create student in Supabase: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      studentId: data.student_id,
      email: data.email,
      passwordHash: '',
      role: 'student',
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || new Date().toISOString(),
    };
  }

  async getLabs(): Promise<LabEntity[]> {
    const supabase = this.getClient();
    const { data } = await supabase.from('labs').select('*').order('lab_number', { ascending: true });
    if (!data || data.length === 0) {
      return dbStore.getLabs();
    }
    return data.map((l: any) => ({
      id: l.id,
      courseId: l.course_id || 'course-mai5124',
      labNumber: l.lab_number,
      title: l.title,
      description: l.description,
      isPublished: true,
      isUnlocked: Boolean(l.is_unlocked),
      examMode: Boolean(l.exam_mode),
      createdAt: l.created_at || new Date().toISOString(),
      updatedAt: l.updated_at || new Date().toISOString(),
    }));
  }

  async getLabById(id: string): Promise<LabEntity | null> {
    const supabase = this.getClient();
    const { data } = await supabase.from('labs').select('*').eq('id', id).single();
    if (!data) {
      return dbStore.getLabById(id) || null;
    }
    return {
      id: data.id,
      courseId: data.course_id || 'course-mai5124',
      labNumber: data.lab_number,
      title: data.title,
      description: data.description,
      isPublished: true,
      isUnlocked: Boolean(data.is_unlocked),
      examMode: Boolean(data.exam_mode),
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || new Date().toISOString(),
    };
  }

  async updateLab(id: string, updates: Partial<LabEntity>): Promise<LabEntity | null> {
    const supabase = this.getClient();
    const supaUpdates: any = {};
    if (updates.isUnlocked !== undefined) supaUpdates.is_unlocked = updates.isUnlocked;
    if (updates.examMode !== undefined) supaUpdates.exam_mode = updates.examMode;

    await supabase.from('labs').update(supaUpdates).eq('id', id);
    return this.getLabById(id);
  }

  async getProgress(userId: string, labId: string): Promise<StudentProgressEntity> {
    const supabase = this.getClient();
    const { data } = await supabase
      .from('user_lab_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lab_id', labId)
      .single();

    if (!data) {
      return {
        id: `prog-${userId}-${labId}`,
        studentId: userId,
        labId,
        status: 'Available',
        lastOpenedAt: new Date().toISOString(),
        progressPercentage: 0,
        updatedAt: new Date().toISOString(),
      };
    }
    return {
      id: data.id,
      studentId: data.user_id,
      labId: data.lab_id,
      status: data.status || 'Available',
      lastOpenedAt: data.last_opened_at || new Date().toISOString(),
      progressPercentage: data.progress_percentage || 0,
      updatedAt: data.updated_at || new Date().toISOString(),
    };
  }

  async getLabProgressDetails(userId: string, labId: string) {
    const submission = await this.getSubmission(userId, labId);
    if (submission) {
      return {
        progressPercentage: 100,
        completedTasks: 5,
        totalTasks: 5,
        status: 'Submitted',
        tasks: [],
        isSubmitted: true,
        submittedAt: submission.submittedAt,
      };
    }

    const progress = await this.getProgress(userId, labId);
    const lab = await this.getLabById(labId);
    const isUnlocked = lab?.isUnlocked ?? false;

    if (!isUnlocked) {
      return {
        progressPercentage: 0,
        completedTasks: 0,
        totalTasks: 5,
        status: 'Locked',
        tasks: [],
        isSubmitted: false,
        submittedAt: null,
      };
    }

    return {
      progressPercentage: progress.progressPercentage,
      completedTasks: Math.round((progress.progressPercentage / 100) * 5),
      totalTasks: 5,
      status: progress.status,
      tasks: [],
      isSubmitted: false,
      submittedAt: null,
    };
  }

  async recordTestRun(userId: string, labId: string, passed: number, total: number): Promise<void> {
    const supabase = this.getClient();
    await supabase.from('test_runs').insert({
      user_id: userId,
      lab_id: labId,
      passed,
      total,
      created_at: new Date().toISOString(),
    });
  }

  async getWorkspace(userId: string, labId: string) {
    const supabase = this.getClient();
    const { data } = await supabase
      .from('workspaces')
      .select('files')
      .eq('user_id', userId)
      .eq('lab_id', labId)
      .single();

    if (!data) return null;
    return { files: data.files };
  }

  async saveWorkspace(userId: string, labId: string, files: Array<{ name: string; language: string; content: string }>) {
    const supabase = this.getClient();
    await supabase.from('workspaces').upsert({
      user_id: userId,
      lab_id: labId,
      files,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,lab_id' });
  }

  async getVisualDesign(userId: string, labId: string) {
    const supabase = this.getClient();
    const { data } = await supabase
      .from('visual_designs')
      .select('design_type, state')
      .eq('user_id', userId)
      .eq('lab_id', labId)
      .single();

    if (!data) return null;
    return { designType: data.design_type, state: data.state };
  }

  async saveVisualDesign(userId: string, labId: string, designType: 'react-flow' | 'blockly', state: any) {
    const supabase = this.getClient();
    await supabase.from('visual_designs').upsert({
      user_id: userId,
      lab_id: labId,
      design_type: designType,
      state,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,lab_id' });
  }

  async getReport(userId: string, labId: string) {
    const supabase = this.getClient();
    const { data } = await supabase
      .from('reports')
      .select('title, content_json, updated_at')
      .eq('user_id', userId)
      .eq('lab_id', labId)
      .single();

    if (!data) return null;
    return { title: data.title, contentJson: data.content_json, updatedAt: data.updated_at };
  }

  async saveReport(userId: string, labId: string, title: string, contentJson: any) {
    const supabase = this.getClient();
    await supabase.from('reports').upsert({
      user_id: userId,
      lab_id: labId,
      title,
      content_json: contentJson,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,lab_id' });
  }

  async getCheckpoints(userId: string, labId: string) {
    const supabase = this.getClient();
    const { data } = await supabase
      .from('checkpoints')
      .select('*')
      .eq('user_id', userId)
      .eq('lab_id', labId)
      .order('created_at', { ascending: false });

    return data || [];
  }

  async createCheckpoint(userId: string, labId: string, label: string, snapshot: any) {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('checkpoints')
      .insert({
        user_id: userId,
        lab_id: labId,
        label,
        snapshot,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async createSubmission(submission: any): Promise<SubmissionEntity> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('submissions')
      .upsert({
        user_id: submission.studentId,
        student_name: submission.studentName,
        student_id: submission.studentCode,
        lab_id: submission.labId,
        report_snapshot: submission.reportSnapshot,
        code_snapshot: submission.codeSnapshot,
        visual_design_snapshot: submission.visualDesignSnapshot,
        test_results_snapshot: submission.testResultsSnapshot,
        submitted_at: new Date().toISOString(),
      }, { onConflict: 'user_id,lab_id' })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return {
      id: data.id,
      studentId: data.user_id,
      studentName: data.student_name,
      studentCode: data.student_id,
      labId: data.lab_id,
      reportSnapshot: data.report_snapshot,
      codeSnapshot: data.code_snapshot,
      visualDesignSnapshot: data.visual_design_snapshot,
      testResultsSnapshot: data.test_results_snapshot,
      submittedAt: data.submitted_at,
    };
  }

  async getSubmission(studentId: string, labId: string): Promise<SubmissionEntity | null> {
    const supabase = this.getClient();
    const { data } = await supabase
      .from('submissions')
      .select('*')
      .eq('user_id', studentId)
      .eq('lab_id', labId)
      .single();

    if (!data) return null;
    return {
      id: data.id,
      studentId: data.user_id,
      studentName: data.student_name,
      studentCode: data.student_id,
      labId: data.lab_id,
      reportSnapshot: data.report_snapshot,
      codeSnapshot: data.code_snapshot,
      visualDesignSnapshot: data.visual_design_snapshot,
      testResultsSnapshot: data.test_results_snapshot,
      submittedAt: data.submitted_at,
    };
  }

  async getSubmissionsForLab(labId: string): Promise<SubmissionEntity[]> {
    const supabase = this.getClient();
    const { data } = await supabase
      .from('submissions')
      .select('*')
      .eq('lab_id', labId)
      .order('submitted_at', { ascending: false });

    if (!data) return [];
    return data.map((d: any) => ({
      id: d.id,
      studentId: d.user_id,
      studentName: d.student_name,
      studentCode: d.student_id,
      labId: d.lab_id,
      reportSnapshot: d.report_snapshot,
      codeSnapshot: d.code_snapshot,
      visualDesignSnapshot: d.visual_design_snapshot,
      testResultsSnapshot: d.test_results_snapshot,
      submittedAt: d.submitted_at,
    }));
  }
}

let activeProvider: DataProvider | null = null;

export function getDataProvider(): DataProvider {
  if (!activeProvider) {
    if (isSupabaseServerConfigured()) {
      activeProvider = new SupabaseDataProvider();
    } else {
      activeProvider = new MemoryDataProvider();
    }
  }
  return activeProvider;
}
