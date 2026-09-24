import { pgTable, text, timestamp, boolean, integer, jsonb, uuid } from 'drizzle-orm/pg-core';

export type UserRole = 'student' | 'lecturer' | 'admin' | 'STUDENT' | 'LECTURER' | 'ADMIN';
export type LabStatus = 'Locked' | 'Available' | 'In Progress' | 'Completed' | 'Submitted';

// 1. Users
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  studentId: text('student_id').unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().$type<UserRole>().default('STUDENT'),
  mustChangePassword: boolean('must_change_password').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Courses
export const courses = pgTable('courses', {
  id: text('id').primaryKey(),
  code: text('code').notNull(), // e.g. "MAI5124"
  title: text('title').notNull(), // "AI in Software Engineering"
  semester: text('semester').notNull().default('Semester 1, 2026/2027'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. Course Memberships
export const courseMemberships = pgTable('course_memberships', {
  id: text('id').primaryKey(),
  courseId: text('course_id').references(() => courses.id).notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
  role: text('role').notNull().$type<UserRole>().default('STUDENT'),
  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
});

// 4. Laboratories
export const labs = pgTable('labs', {
  id: text('id').primaryKey(), // e.g. "lab01-behavioral-programming"
  courseId: text('course_id').references(() => courses.id).notNull(),
  labNumber: integer('lab_number').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  isPublished: boolean('is_published').notNull().default(true),
  isUnlocked: boolean('is_unlocked').notNull().default(false),
  unlockAt: timestamp('unlock_at'),
  deadline: timestamp('deadline'),
  examMode: boolean('exam_mode').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 5. Student Lab Progress
export const studentLabProgress = pgTable('student_lab_progress', {
  id: text('id').primaryKey(),
  studentId: text('student_id').references(() => users.id).notNull(),
  labId: text('lab_id').references(() => labs.id).notNull(),
  status: text('status').notNull().$type<LabStatus>().default('Available'),
  lastOpenedAt: timestamp('last_opened_at').defaultNow().notNull(),
  progressPercentage: integer('progress_percentage').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 6. Workspaces (Code files)
export const workspaces = pgTable('workspaces', {
  id: text('id').primaryKey(),
  studentId: text('student_id').references(() => users.id).notNull(),
  labId: text('lab_id').references(() => labs.id).notNull(),
  files: jsonb('files').notNull(), // Array<{ name: string; content: string; language: string }>
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 7. Visual Designs (React Flow / Blockly state)
export const visualDesigns = pgTable('visual_designs', {
  id: text('id').primaryKey(),
  studentId: text('student_id').references(() => users.id).notNull(),
  labId: text('lab_id').references(() => labs.id).notNull(),
  designType: text('design_type').notNull(), // 'react-flow' | 'blockly'
  stateJson: jsonb('state_json').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 8. Test Runs
export const testRuns = pgTable('test_runs', {
  id: text('id').primaryKey(),
  studentId: text('student_id').references(() => users.id).notNull(),
  labId: text('lab_id').references(() => labs.id).notNull(),
  totalTests: integer('total_tests').notNull(),
  passedTests: integer('passed_tests').notNull(),
  resultsJson: jsonb('results_json').notNull(),
  runAt: timestamp('run_at').defaultNow().notNull(),
});

// 9. Reports
export const reports = pgTable('reports', {
  id: text('id').primaryKey(),
  studentId: text('student_id').references(() => users.id).notNull(),
  labId: text('lab_id').references(() => labs.id).notNull(),
  title: text('title').notNull(),
  contentJson: jsonb('content_json').notNull(), // Structured sections and markdown/html
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 10. Report Assets
export const reportAssets = pgTable('report_assets', {
  id: text('id').primaryKey(),
  reportId: text('report_id').references(() => reports.id).notNull(),
  assetUrl: text('asset_url').notNull(),
  caption: text('caption'),
  fileType: text('file_type').notNull(),
  size: integer('size').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 11. Checkpoints
export const checkpoints = pgTable('checkpoints', {
  id: text('id').primaryKey(),
  studentId: text('student_id').references(() => users.id).notNull(),
  labId: text('lab_id').references(() => labs.id).notNull(),
  label: text('label').notNull(),
  snapshotJson: jsonb('snapshot_json').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 12. Submissions (Immutable Assessment Snapshot)
export const submissions = pgTable('submissions', {
  id: text('id').primaryKey(),
  studentId: text('student_id').references(() => users.id).notNull(),
  labId: text('lab_id').references(() => labs.id).notNull(),
  reportSnapshot: jsonb('report_snapshot').notNull(),
  codeSnapshot: jsonb('code_snapshot').notNull(),
  visualDesignSnapshot: jsonb('visual_design_snapshot').notNull(),
  testResultsSnapshot: jsonb('test_results_snapshot').notNull(),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  grade: text('grade'),
  lecturerFeedback: text('lecturer_feedback'),
});
