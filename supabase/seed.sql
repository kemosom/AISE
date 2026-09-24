-- Supabase Development Seed Data
-- Course: MAI5124 AI in Software Engineering
-- Instructions: In Supabase CLI or SQL Editor, execute this script or run 'npm run db:seed'

-- Note: auth.users in Supabase are generated via auth.signUp() or supabase.auth.admin.createUser().
-- The below SQL seeds profiles for development once corresponding auth records exist.

DO $$
DECLARE
  v_course_id UUID;
BEGIN
  SELECT id INTO v_course_id FROM public.courses WHERE code = 'MAI5124' LIMIT 1;

  -- Ensure course exists
  IF v_course_id IS NULL THEN
    INSERT INTO public.courses (code, title, semester, description)
    VALUES ('MAI5124', 'AI in Software Engineering', 'Semester 1, 2026/2027', 'Master of Applied AI Interactive Labs')
    RETURNING id INTO v_course_id;
  END IF;

  -- Seed initial lab configurations
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
    is_unlocked = EXCLUDED.is_unlocked;
END $$;
