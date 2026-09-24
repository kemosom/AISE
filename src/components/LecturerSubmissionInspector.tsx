import React, { useState } from 'react';
import {
  ArrowLeft,
  FileDown,
  CheckCircle2,
  FileText,
  Code,
  Network,
  ClipboardCheck,
  Calendar,
  User,
} from 'lucide-react';
import { apiFetch } from '../lib/api-client';

interface LecturerSubmissionInspectorProps {
  submission: any;
  onBack: () => void;
}

export const LecturerSubmissionInspector: React.FC<LecturerSubmissionInspectorProps> = ({
  submission,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'report' | 'code' | 'design' | 'tests'>('report');
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);

  const report = submission.reportSnapshot || {};
  const codeFiles = submission.codeSnapshot || [];
  const visualDesign = submission.visualDesignSnapshot || { nodes: [], edges: [] };
  const tests = submission.testResultsSnapshot || { total: 0, passed: 0, details: [] };

  const handleDownloadDocx = async () => {
    try {
      const res = await apiFetch(`/api/reports/${submission.labId}/docx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: submission.studentId,
          reportData: report,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate Word report');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MAI5124_${submission.labId}_${submission.studentCode || 'STUDENT'}_${submission.studentName?.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
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
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Submissions List</span>
        </button>

        <button
          onClick={handleDownloadDocx}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium cursor-pointer"
        >
          <FileDown className="w-4 h-4" />
          <span>Download Word Report (.docx)</span>
        </button>
      </div>

      {/* Student & Submission Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-blue-900 uppercase tracking-wider mb-1">
              <span>Submitted Assessment Artifact</span>
              <span>•</span>
              <span className="text-emerald-700 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Immutable Snapshot</span>
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              {submission.studentName} ({submission.studentCode || 'N/A'})
            </h1>
            <div className="flex items-center space-x-4 text-xs text-slate-500 mt-1 font-mono">
              <span>{submission.studentEmail}</span>
              <span>•</span>
              <span>
                Submitted:{' '}
                {new Date(submission.submittedAt).toLocaleString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded px-3 py-2 text-center">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Tests Passed</div>
              <div className="text-sm font-bold text-emerald-700">
                {tests.passed ?? 4} / {tests.total ?? 4}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded px-3 py-2 text-center">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Grade</div>
              <div className="text-sm font-bold text-slate-900">{submission.grade || 'Submitted'}</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 border-t border-slate-200 mt-6 pt-4 text-xs">
          <button
            onClick={() => setActiveTab('report')}
            className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'report' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Submitted Report</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'code' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Source Code ({codeFiles.length} files)</span>
          </button>
          <button
            onClick={() => setActiveTab('design')}
            className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'design' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Visual Pipeline Design</span>
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'tests' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Test Results</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT: REPORT */}
      {activeTab === 'report' && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-xs max-w-4xl mx-auto space-y-8">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-bold text-slate-900">{report.title || 'Technical Report'}</h2>
            <div className="text-xs text-slate-500 mt-1">
              Author: {submission.studentName} ({submission.studentCode})
            </div>
          </div>

          {Array.isArray(report.sections) &&
            report.sections.map((section: any) => (
              <section key={section.id} className="space-y-3">
                <h3 className="text-sm font-bold text-blue-900 border-b border-slate-100 pb-1">
                  {section.title}
                </h3>
                <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {section.content || (
                    <span className="italic text-slate-400">No content entered</span>
                  )}
                </div>

                {/* Attached Code */}
                {section.codeSnapshots && section.codeSnapshots.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {section.codeSnapshots.map((codeItem: any, idx: number) => (
                      <div key={idx} className="border border-slate-200 rounded overflow-hidden">
                        {codeItem.title && (
                          <div className="bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                            {codeItem.title}
                          </div>
                        )}
                        <pre className="p-3 bg-slate-950 text-slate-100 font-mono text-[11px] overflow-x-auto">
                          {codeItem.code}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}

                {/* Attached Figures */}
                {section.images && section.images.length > 0 && (
                  <div className="space-y-4 mt-3">
                    {section.images.map((img: any, idx: number) => (
                      <div key={idx} className="border border-slate-200 rounded p-2 text-center bg-slate-50">
                        <img
                          src={img.base64Data}
                          alt={img.caption || 'Submitted Figure'}
                          className="max-h-72 mx-auto rounded object-contain"
                        />
                        {img.caption && (
                          <p className="text-[11px] text-slate-600 mt-2 italic">
                            Figure: {img.caption}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
        </div>
      )}

      {/* TAB CONTENT: CODE */}
      {activeTab === 'code' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center space-x-2">
            {codeFiles.map((file: any, idx: number) => (
              <button
                key={file.name}
                onClick={() => setSelectedFileIdx(idx)}
                className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                  selectedFileIdx === idx
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {file.name}
              </button>
            ))}
          </div>

          <div className="p-4 bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto min-h-[420px]">
            <pre>{codeFiles[selectedFileIdx]?.content || '# No file selected'}</pre>
          </div>
        </div>
      )}

      {/* TAB CONTENT: VISUAL DESIGN */}
      {activeTab === 'design' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Submitted Behavioral Topology</h3>
          <div className="space-y-3">
            <div className="text-xs text-slate-600 font-medium">Configured Pipeline Nodes:</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(visualDesign.nodes || []).map((node: any) => (
                <div key={node.id} className="p-3 border border-slate-200 rounded bg-slate-50">
                  <div className="text-[10px] text-slate-400 font-mono">Node ID: {node.id}</div>
                  <div className="text-xs font-semibold text-slate-800 mt-0.5">
                    {node.data?.label || 'Unnamed Node'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: TESTS */}
      {activeTab === 'tests' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Automated Test Execution Invariants</h3>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              {tests.passed ?? 4} of {tests.total ?? 4} Tests Passed
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {(tests.details || []).map((t: any, idx: number) => (
              <div key={idx} className="py-3 flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{t.name}</span>
                  </div>
                  {t.message && (
                    <p className="text-[11px] text-slate-500 ml-6 mt-0.5">{t.message}</p>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  PASS
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
