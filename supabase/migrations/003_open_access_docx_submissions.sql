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
