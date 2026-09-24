-- Supabase Migration: 001_initial_schema.sql
-- Course: MAI5124 AI in Software Engineering
-- Architecture: Supabase PostgreSQL + Auth + Storage

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles (References auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  student_id TEXT UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('student', 'lecturer', 'admin')) DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON public.profiles(student_id);

-- 2. Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  semester TEXT NOT NULL DEFAULT 'Semester 1, 2026/2027',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Default Course
INSERT INTO public.courses (code, title, semester, description)
VALUES (
  'MAI5124',
  'AI in Software Engineering',
  'Semester 1, 2026/2027',
  'Master of Applied Artificial Intelligence - Interactive Laboratory Curriculum'
)
ON CONFLICT (code) DO NOTHING;

-- 3. Course Members Table (Role membership)
CREATE TABLE IF NOT EXISTS public.course_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'lecturer', 'admin')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(course_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_course_members_user ON public.course_members(user_id);
CREATE INDEX IF NOT EXISTS idx_course_members_course ON public.course_members(course_id);

-- 4. Laboratories (Dynamic laboratory runtime state)
CREATE TABLE IF NOT EXISTS public.labs (
  id TEXT PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  lab_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  short_description TEXT,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  is_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  unlock_at TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  exam_mode BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Lab Releases (Audit and scheduling)
CREATE TABLE IF NOT EXISTS public.lab_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id TEXT NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  is_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  unlock_at TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  released_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Lab Progress (Tracking student module progress)
CREATE TABLE IF NOT EXISTS public.lab_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lab_id TEXT NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('Locked', 'Available', 'In Progress', 'Completed', 'Submitted')) DEFAULT 'Available',
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  last_opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lab_id)
);

CREATE INDEX IF NOT EXISTS idx_lab_progress_user ON public.lab_progress(user_id);

-- 7. Workspaces (Student code workspace metadata)
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lab_id TEXT NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  active_file TEXT NOT NULL DEFAULT 'main.py',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lab_id)
);

CREATE INDEX IF NOT EXISTS idx_workspaces_user_lab ON public.workspaces(user_id, lab_id);

-- 8. Workspace Files (Virtual files: main.py, helpers.py, README.md)
CREATE TABLE IF NOT EXISTS public.workspace_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'python',
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, path)
);

CREATE INDEX IF NOT EXISTS idx_workspace_files_ws ON public.workspace_files(workspace_id);

-- 9. Visual Designs (React Flow graph state / Blockly XML)
CREATE TABLE IF NOT EXISTS public.visual_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lab_id TEXT NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  design_type TEXT NOT NULL DEFAULT 'react-flow',
  state_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lab_id, design_type)
);

-- 10. Test Runs (Automated test verification execution results)
CREATE TABLE IF NOT EXISTS public.test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lab_id TEXT NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  total_tests INTEGER NOT NULL DEFAULT 0,
  passed_tests INTEGER NOT NULL DEFAULT 0,
  results_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_runs_user_lab ON public.test_runs(user_id, lab_id);

-- 11. Reports (Structured academic lab reports)
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  lab_id TEXT NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lab_id)
);

CREATE INDEX IF NOT EXISTS idx_reports_user_lab ON public.reports(user_id, lab_id);

-- 12. Report Assets (Metadata for images stored in Supabase Storage)
CREATE TABLE IF NOT EXISTS public.report_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lab_id TEXT NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  asset_url TEXT NOT NULL,
  caption TEXT,
  file_type TEXT NOT NULL,
  size INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Submissions (Immutable academic submission snapshots)
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  lab_id TEXT NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_snapshot JSONB NOT NULL,
  workspace_snapshot JSONB NOT NULL,
  design_snapshot JSONB NOT NULL,
  test_snapshot JSONB NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'Submitted',
  grade TEXT,
  lecturer_feedback TEXT,
  UNIQUE(user_id, lab_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_user_lab ON public.submissions(user_id, lab_id);
CREATE INDEX IF NOT EXISTS idx_submissions_lab ON public.submissions(lab_id);

-- 14. Submission Assets
CREATE TABLE IF NOT EXISTS public.submission_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  asset_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Checkpoints (Versioned workspace snapshots)
CREATE TABLE IF NOT EXISTS public.checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lab_id TEXT NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  snapshot_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Dynamic Lab Records (Lab 01 is unlocked by default; Labs 02-11 + Exam are initially locked)
DO $$
DECLARE
  v_course_id UUID;
BEGIN
  SELECT id INTO v_course_id FROM public.courses WHERE code = 'MAI5124' LIMIT 1;

  INSERT INTO public.labs (id, course_id, lab_number, title, short_description, is_published, is_unlocked, exam_mode)
  VALUES
    ('lab01-behavioral-programming', v_course_id, 1, 'Behavioral Programming & B-Threads', 'Formal reactive systems via Request-Wait-Block coordination protocol.', true, true, false),
    ('lab02-requirement-prioritization', v_course_id, 2, 'Requirements Prioritization ML', 'Supervised text classification & MoSCoW ranking algorithms.', true, false, false),
    ('lab03-social-commitment-agents', v_course_id, 3, 'Social Commitment Agents', 'Formal multi-agent communication schemas and contract states.', true, false, false),
    ('lab04-intelligent-agents', v_course_id, 4, 'Intelligent BDI Agent Reasoning', 'Belief-Desire-Intention deliberative loops and dynamic planning.', true, false, false),
    ('lab05-artifact-generation', v_course_id, 5, 'Automated Artifact Generation', 'Syntax grammar parsing and automated UML statechart synthesis.', true, false, false),
    ('lab06-software-fusion', v_course_id, 6, 'Software Fusion & Design Learning', 'AST graph embeddings and architectural anti-pattern detection.', true, false, false),
    ('lab07-software-auto-generation', v_course_id, 7, 'Cyber-Physical Auto-Generation', 'Linear temporal logic (LTL) specifications and state controller synthesis.', true, false, false),
    ('lab08-ai-software-testing', v_course_id, 8, 'AI Testing & Machine-Learned Oracles', 'Metamorphic testing relations and differential fault invariant classifiers.', true, false, false),
    ('lab09-risk-based-testing', v_course_id, 9, 'Risk-Based Software Testing', 'Bayesian belief networks and failure impact prioritization matrices.', true, false, false),
    ('lab10-spreadsheet-debugging', v_course_id, 10, 'AI Spreadsheet Debugging', 'Cell calculation DAG dependency trees and semantic anomaly localization.', true, false, false),
    ('lab11-ai-software-debugging', v_course_id, 11, 'AI Software Debugging & SBFL', 'Spectrum-based fault localization (Ochiai/Tarantula) & patch synthesis.', true, false, false),
    ('exam-code-review', v_course_id, 12, 'Practical Examination: AI-Assisted Review', 'Rigorous security vulnerability audit and automated remediation harness.', true, false, true)
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    short_description = EXCLUDED.short_description;
END $$;
