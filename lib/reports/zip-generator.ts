import JSZip from 'jszip';
import { generateDocxReport, type DocxReportInput } from './docx-generator';

export interface StudentSubmissionForZip {
  studentId: string;
  studentName: string;
  studentEmail: string;
  labNumber: number;
  labTitle: string;
  reportData: DocxReportInput;
}

export async function generateSubmissionsZip(
  labId: string,
  labTitle: string,
  submissions: StudentSubmissionForZip[]
): Promise<Blob> {
  const zip = new JSZip();

  for (const item of submissions) {
    const docxBlob = await generateDocxReport(item.reportData);
    const sanitizedName = item.studentName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${item.studentId || 'STUDENT'}_${sanitizedName}_Lab${String(item.labNumber).padStart(2, '0')}.docx`;
    zip.file(filename, docxBlob);
  }

  // Add a manifest text file
  const manifestContent = `MAI5124 AI in Software Engineering
Laboratory Submissions Archive
Lab: ${labTitle} (${labId})
Generated at: ${new Date().toISOString()}
Total Submissions: ${submissions.length}

Included Reports:
${submissions.map((s, idx) => `${idx + 1}. [${s.studentId}] ${s.studentName} (${s.studentEmail})`).join('\n')}
`;
  zip.file('SUMMARY_MANIFEST.txt', manifestContent);

  return await zip.generateAsync({ type: 'blob' });
}
