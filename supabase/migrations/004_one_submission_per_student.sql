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
