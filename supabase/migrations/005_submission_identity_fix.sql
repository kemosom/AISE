-- Supabase Migration: 005_submission_identity_fix.sql
-- Purpose:
--   Open-access students authenticate to Supabase anonymously in the browser.
--   One browser therefore keeps the same auth.uid() across submissions.
--   The old UNIQUE(user_id, lab_id) constraint incorrectly treated the browser
--   session as the academic identity and blocked a second student ID on the
--   same browser.
--
-- Academic identity is now enforced by the normalized student ID constraint
-- created in migration 004:
--   UNIQUE(lab_id, LOWER(BTRIM(student_code)))

ALTER TABLE public.submissions
  DROP CONSTRAINT IF EXISTS submissions_user_id_lab_id_key;

-- Ensure the intended academic uniqueness rule exists even if migration 004
-- was applied separately.
CREATE UNIQUE INDEX IF NOT EXISTS uq_submissions_lab_student_code_normalized
  ON public.submissions (
    lab_id,
    LOWER(BTRIM(student_code))
  )
  WHERE student_code IS NOT NULL
    AND BTRIM(student_code) <> '';

-- Keep lookup performance for lecturer/admin tools and owner RLS.
CREATE INDEX IF NOT EXISTS idx_submissions_user_lab
  ON public.submissions(user_id, lab_id);
