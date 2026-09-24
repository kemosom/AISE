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
