import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  FileDown,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  User,
  Calendar,
} from 'lucide-react';
import type { AuthUserPublic } from '../../lib/auth/types';
import { apiClient, apiFetch } from '../lib/api-client';

interface LecturerSubmissionsViewProps {
  labId: string;
  user: AuthUserPublic;
  onBack: () => void;
  onInspectSubmission: (submission: any) => void;
}

export const LecturerSubmissionsView: React.FC<LecturerSubmissionsViewProps> = ({
  labId,
  user,
  onBack,
  onInspectSubmission,
}) => {
  const [lab, setLab] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingZip, setDownloadingZip] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, [labId]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const [labData, subData] = await Promise.all([
        apiClient.get(`/api/labs/${labId}?preview=true`),
        apiClient.get(`/api/submissions/${labId}`),
      ]);

      setLab(labData.lab);
      setSubmissions(subData.submissions || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadZip = async () => {
    setDownloadingZip(true);
    try {
      const res = await apiFetch(`/api/lecturer/labs/${labId}/download-all`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to download zip');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MAI5124_${labId}_Submissions.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleDownloadDocx = async (sub: any) => {
    try {
      const res = await fetch(`/api/reports/${labId}/docx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: sub.studentId,
          reportData: sub.reportSnapshot,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate Word report');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MAI5124_Lab${String(lab?.labNumber || 1).padStart(2, '0')}_${sub.studentCode || 'STUDENT'}_${sub.studentName?.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Lecturer Overview</span>
        </button>

        <button
          onClick={handleDownloadZip}
          disabled={downloadingZip || submissions.length === 0}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium cursor-pointer disabled:opacity-50"
        >
          <FileDown className="w-4 h-4" />
          <span>{downloadingZip ? 'Generating ZIP Archive...' : 'Download All Reports (.zip)'}</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-2 text-xs font-semibold text-blue-900 uppercase tracking-wider mb-1">
          <span>Laboratory Assessment Records</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900">
          {lab ? `Lab ${String(lab.labNumber).padStart(2, '0')}: ${lab.title}` : 'Loading...'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Total immutable student submissions recorded: <strong>{submissions.length}</strong>
        </p>
      </div>

      {/* Submissions Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Progress</th>
                <th className="py-3 px-4">Automated Tests</th>
                <th className="py-3 px-4">Submitted At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No submissions recorded for this laboratory yet.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => {
                  const tests = sub.testResultsSnapshot || {};
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{sub.studentName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{sub.studentEmail}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                        {sub.studentCode || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>100% Submitted</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium">
                        <span className="text-emerald-700 font-semibold">
                          {tests.passed ?? 4}/{tests.total ?? 4} Passed
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(sub.submittedAt).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleDownloadDocx(sub)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded text-xs font-medium cursor-pointer"
                          title="Download Word Report"
                        >
                          <FileDown className="w-3.5 h-3.5 text-blue-900" />
                          <span>.docx</span>
                        </button>
                        <button
                          onClick={() => onInspectSubmission(sub)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
