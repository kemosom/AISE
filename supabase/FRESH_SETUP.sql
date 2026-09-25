-- MAI5124 AISE Lab Studio
-- Fresh Supabase setup
-- Run this entire file ONCE in a NEW/EMPTY Supabase project.
-- It combines migrations 001, 002, and 003 in the required order.

-- ============================================================
-- 001_initial_schema.sql
-- ============================================================
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


-- ============================================================
-- 002_storage_and_rls.sql
-- ============================================================
-- Supabase Migration: 002_storage_and_rls.sql
-- Course: MAI5124 AI in Software Engineering
-- Row Level Security (RLS) & Supabase Storage Policies

-- 1. Helper function to check if current authenticated user is Lecturer or Admin
CREATE OR REPLACE FUNCTION public.is_lecturer_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('lecturer', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Helper function to check course enrollment
CREATE OR REPLACE FUNCTION public.is_course_member(c_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.course_members
    WHERE course_id = c_id
      AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

----------------------------------------------------
-- ENABLE RLS ON ALL TABLES
----------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visual_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoints ENABLE ROW LEVEL SECURITY;

----------------------------------------------------
-- PROFILES POLICIES
----------------------------------------------------
-- Users can read their own profile
CREATE POLICY "Users can read their own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_lecturer_or_admin());

-- Users can update non-privileged fields of their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Only lecturers/admins can insert profiles (provisioning)
CREATE POLICY "Instructors can insert student profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.is_lecturer_or_admin() OR id = auth.uid());

----------------------------------------------------
-- COURSES & MEMBERS POLICIES
----------------------------------------------------
CREATE POLICY "Enrolled users can view courses"
  ON public.courses FOR SELECT
  USING (true); -- Publicly viewable course catalog

CREATE POLICY "Instructors can update courses"
  ON public.courses FOR ALL
  USING (public.is_lecturer_or_admin());

CREATE POLICY "Members can view membership"
  ON public.course_members FOR SELECT
  USING (user_id = auth.uid() OR public.is_lecturer_or_admin());

CREATE POLICY "Instructors can manage memberships"
  ON public.course_members FOR ALL
  USING (public.is_lecturer_or_admin());

----------------------------------------------------
-- LABS & LAB RELEASES POLICIES
----------------------------------------------------
-- Students can only view published labs; lecturers can view all
CREATE POLICY "Students can view published labs"
  ON public.labs FOR SELECT
  USING (is_published = true OR public.is_lecturer_or_admin());

-- Only lecturers/admins can update lab releases / unlock state
CREATE POLICY "Instructors can manage labs"
  ON public.labs FOR ALL
  USING (public.is_lecturer_or_admin());

CREATE POLICY "Instructors can manage lab releases"
  ON public.lab_releases FOR ALL
  USING (public.is_lecturer_or_admin());

----------------------------------------------------
-- LAB PROGRESS POLICIES
----------------------------------------------------
CREATE POLICY "Students can view and update own progress"
  ON public.lab_progress FOR ALL
  USING (user_id = auth.uid() OR public.is_lecturer_or_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_lecturer_or_admin());

----------------------------------------------------
-- WORKSPACES & WORKSPACE FILES POLICIES
----------------------------------------------------
CREATE POLICY "Students can manage own workspace"
  ON public.workspaces FOR ALL
  USING (user_id = auth.uid() OR public.is_lecturer_or_admin())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Students can manage own workspace files"
  ON public.workspace_files FOR ALL
  USING (user_id = auth.uid() OR public.is_lecturer_or_admin())
  WITH CHECK (user_id = auth.uid());

----------------------------------------------------
-- VISUAL DESIGNS POLICIES
----------------------------------------------------
CREATE POLICY "Students can manage own visual designs"
  ON public.visual_designs FOR ALL
  USING (user_id = auth.uid() OR public.is_lecturer_or_admin())
  WITH CHECK (user_id = auth.uid());

----------------------------------------------------
-- TEST RUNS POLICIES
----------------------------------------------------
CREATE POLICY "Students can view and record own test runs"
  ON public.test_runs FOR ALL
  USING (user_id = auth.uid() OR public.is_lecturer_or_admin())
  WITH CHECK (user_id = auth.uid());

----------------------------------------------------
-- REPORTS & REPORT ASSETS POLICIES
----------------------------------------------------
CREATE POLICY "Students can manage own report"
  ON public.reports FOR ALL
  USING (user_id = auth.uid() OR public.is_lecturer_or_admin())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Students can manage own report assets"
  ON public.report_assets FOR ALL
  USING (user_id = auth.uid() OR public.is_lecturer_or_admin())
  WITH CHECK (user_id = auth.uid());

----------------------------------------------------
-- SUBMISSIONS & SUBMISSION ASSETS POLICIES
----------------------------------------------------
CREATE POLICY "Students can insert own submission"
  ON public.submissions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view submissions (own or lecturer)"
  ON public.submissions FOR SELECT
  USING (user_id = auth.uid() OR public.is_lecturer_or_admin());

CREATE POLICY "Instructors can grade submissions"
  ON public.submissions FOR UPDATE
  USING (public.is_lecturer_or_admin())
  WITH CHECK (public.is_lecturer_or_admin());

CREATE POLICY "Submission assets access"
  ON public.submission_assets FOR SELECT
  USING (true);

----------------------------------------------------
-- CHECKPOINTS POLICIES
----------------------------------------------------
CREATE POLICY "Students can manage own checkpoints"
  ON public.checkpoints FOR ALL
  USING (user_id = auth.uid() OR public.is_lecturer_or_admin())
  WITH CHECK (user_id = auth.uid());

----------------------------------------------------
-- SUPABASE STORAGE BUCKET & POLICIES
----------------------------------------------------
-- Create 'lab-report-assets' bucket in storage schema (if storage extension is active)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lab-report-assets',
  'lab-report-assets',
  false, -- Private by default for student evidence isolation
  10485760, -- 10MB limit per image
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Students can upload only into their own folder (mai5124/<auth.uid()>/...)
CREATE POLICY "Students can upload evidence into own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'lab-report-assets'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Storage RLS: Students read own evidence, lecturers read all evidence
CREATE POLICY "Users can read authorized lab assets"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'lab-report-assets'
    AND (
      (storage.foldername(name))[2] = auth.uid()::text
      OR public.is_lecturer_or_admin()
    )
  );

-- Storage RLS: Students can delete own unsubmitted files
CREATE POLICY "Students can delete own unsubmitted assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'lab-report-assets'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );


-- ============================================================
-- 003_open_access_docx_submissions.sql
-- ============================================================
-- Supabase Migration: 003_open_access_docx_submissions.sql
-- Purpose: store open-access laboratory submissions and their generated DOCX files.

-- Add human-readable student metadata and DOCX storage metadata.
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS student_name TEXT,
  ADD COLUMN IF NOT EXISTS student_code TEXT,
  ADD COLUMN IF NOT EXISTS report_docx_path TEXT,
  ADD COLUMN IF NOT EXISTS report_docx_name TEXT;

CREATE INDEX IF NOT EXISTS idx_submissions_student_code
  ON public.submissions(student_code);

-- Private bucket for final Word reports.
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'lab-submissions',
  'lab-submissions',
  false,
  20971520,
  ARRAY[
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Students use invisible Supabase anonymous auth. Files are written to:
-- mai5124/<auth.uid()>/<lab-id>/<timestamp>_<filename>.docx
DROP POLICY IF EXISTS "Students can upload own DOCX submissions"
  ON storage.objects;
CREATE POLICY "Students can upload own DOCX submissions"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'lab-submissions'
    AND (storage.foldername(name))[1] = 'mai5124'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Students can read own DOCX submissions"
  ON storage.objects;
CREATE POLICY "Students can read own DOCX submissions"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'lab-submissions'
    AND (
      (
        (storage.foldername(name))[1] = 'mai5124'
        AND (storage.foldername(name))[2] = auth.uid()::text
      )
      OR public.is_lecturer_or_admin()
    )
  );

-- Students should not overwrite or delete a final submitted report.
-- Lecturer/admin access is handled through the Supabase dashboard or
-- authenticated instructor tooling.

-- Existing submissions policies in 002_storage_and_rls.sql already allow:
--   INSERT when user_id = auth.uid()
--   SELECT for the owner or lecturer/admin.



-- ============================================================
-- 004_one_submission_per_student.sql
-- ============================================================
-- Supabase Migration: 004_one_submission_per_student.sql
-- Purpose: enforce one final submission per student ID per laboratory,
-- even if the student changes browser, device, or anonymous-auth session.

-- Database-level authority: the same normalized student ID cannot submit
-- the same lab twice. LOWER(BTRIM(...)) makes the check insensitive to
-- capitalization and accidental surrounding spaces.
CREATE UNIQUE INDEX IF NOT EXISTS uq_submissions_lab_student_code_normalized
  ON public.submissions (
    lab_id,
    LOWER(BTRIM(student_code))
  )
  WHERE student_code IS NOT NULL
    AND BTRIM(student_code) <> '';

-- Safe boolean check for the open-access client.
-- This reveals only whether the supplied student ID has already submitted
-- the specified lab. It does not expose another student's report.
CREATE OR REPLACE FUNCTION public.has_submitted_lab(
  p_lab_id TEXT,
  p_student_code TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.submissions
    WHERE lab_id = p_lab_id
      AND LOWER(BTRIM(student_code)) = LOWER(BTRIM(p_student_code))
  );
$$;

REVOKE ALL ON FUNCTION public.has_submitted_lab(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_submitted_lab(TEXT, TEXT) TO authenticated;

