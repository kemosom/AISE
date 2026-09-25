import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from '../../lib/supabase/client';
import { setBrowserValue } from './browser-persistence';

export interface LabSubmissionInput {
  labId: string;
  studentName: string;
  studentId: string;
  reportSnapshot: unknown;
  codeSnapshot: unknown;
  testSnapshot: unknown;
  docxBlob: Blob;
  docxFileName: string;
}

export interface LabSubmissionReceipt {
  id: string;
  submittedAt: string;
  storagePath: string;
  fileName: string;
}

async function ensureAnonymousUser(client: SupabaseClient) {
  const {
    data: { session },
  } = await client.auth.getSession();

  if (session?.user) {
    return session.user;
  }

  const { data, error } = await client.auth.signInAnonymously();

  if (error || !data.user) {
    throw new Error(
      error?.message ||
        'Anonymous Supabase access is not enabled. Ask the lecturer to enable Anonymous Sign-Ins in Supabase Auth.'
    );
  }

  return data.user;
}

function safePart(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

export async function submitLabReportToSupabase(
  input: LabSubmissionInput
): Promise<LabSubmissionReceipt> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured for this site. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.'
    );
  }

  const client = getSupabaseBrowserClient();

  if (!client) {
    throw new Error('Unable to create the Supabase client.');
  }

  const user = await ensureAnonymousUser(client);
  const normalizedStudentId = input.studentId.trim().toUpperCase();

  const { data: studentAlreadySubmitted, error: studentCheckError } =
    await client.rpc('has_submitted_lab', {
      p_lab_id: input.labId,
      p_student_code: normalizedStudentId,
    });

  if (studentCheckError) {
    throw new Error(
      `Unable to verify previous submissions: ${studentCheckError.message}`
    );
  }

  if (studentAlreadySubmitted) {
    throw new Error(
      `Student ID ${normalizedStudentId} has already submitted this laboratory. Contact the lecturer if a replacement submission is required.`
    );
  }

  const { data: existing, error: existingError } = await client
    .from('submissions')
    .select('id, submitted_at, report_docx_path, report_docx_name')
    .eq('user_id', user.id)
    .eq('lab_id', input.labId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    throw new Error(
      'This browser has already submitted this laboratory. Contact the lecturer if a replacement submission is required.'
    );
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const studentCode = safePart(input.studentId) || 'student';
  const studentName = safePart(input.studentName) || 'student';
  const fileName =
    input.docxFileName ||
    `MAI5124_${input.labId}_${studentCode}_${studentName}.docx`;

  const storagePath =
    `mai5124/${user.id}/${input.labId}/${timestamp}_${fileName}`;

  const { error: uploadError } = await client.storage
    .from('lab-submissions')
    .upload(storagePath, input.docxBlob, {
      contentType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Report upload failed: ${uploadError.message}`);
  }

  const { data: submission, error: insertError } = await client
    .from('submissions')
    .insert({
      lab_id: input.labId,
      user_id: user.id,
      student_name: input.studentName.trim(),
      student_code: normalizedStudentId,
      report_snapshot: input.reportSnapshot,
      workspace_snapshot: input.codeSnapshot || {},
      design_snapshot: {},
      test_snapshot: input.testSnapshot || {},
      report_docx_path: storagePath,
      report_docx_name: fileName,
      status: 'Submitted',
    })
    .select('id, submitted_at, report_docx_path, report_docx_name')
    .single();

  if (insertError || !submission) {
    await client.storage.from('lab-submissions').remove([storagePath]);

    if (insertError?.code === '23505') {
      throw new Error(
        `Student ID ${normalizedStudentId} has already submitted this laboratory. Only one final submission is allowed per student ID.`
      );
    }

    throw new Error(
      `Submission record could not be saved: ${insertError?.message || 'Unknown database error'}`
    );
  }

  const receipt: LabSubmissionReceipt = {
    id: submission.id,
    submittedAt: submission.submitted_at,
    storagePath: submission.report_docx_path,
    fileName: submission.report_docx_name,
  };

  // Keep both keys because the dashboard currently reads the older key while
  // the lab workspace uses the v2 namespace.
  await Promise.all([
    setBrowserValue(`aise:${input.labId}:submission`, receipt),
    setBrowserValue(`aise:v2:${input.labId}:submission`, receipt),
  ]);

  return receipt;
}
