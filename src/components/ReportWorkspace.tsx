import React, { useState } from 'react';
import {
  FileText,
  FileDown,
  Upload,
  Bookmark,
  Check,
  Eye,
  Trash2,
  Clock,
  Plus,
  Image as ImageIcon,
  Code,
  CheckCircle,
  User,
} from 'lucide-react';
import type { AuthUserPublic } from '../../lib/auth/types';
import { apiFetch } from '../lib/api-client';

export interface ReportSectionItem {
  id: string;
  title: string;
  content: string;
  codeSnapshots?: Array<{ title?: string; code: string; language?: string }>;
  images?: Array<{ base64Data: string; caption?: string }>;
}

export interface ReportState {
  title: string;
  studentName?: string;
  studentId?: string;
  sections: ReportSectionItem[];
}

interface ReportWorkspaceProps {
  labId: string;
  labNumber: number;
  labTitle: string;
  user: AuthUserPublic;
  reportState: ReportState;
  onUpdateReportState: (newState: ReportState) => void;
  onSaveReport: (reportToSave: ReportState) => Promise<void>;
  saveStatus: string;
  checkpoints: any[];
  onCreateCheckpoint: (label: string, snapshot: any) => Promise<void>;
}

export const ReportWorkspace: React.FC<ReportWorkspaceProps> = ({
  labId,
  labNumber,
  labTitle,
  user,
  reportState,
  onUpdateReportState,
  onSaveReport,
  saveStatus,
  checkpoints,
  onCreateCheckpoint,
}) => {
  const [activeSectionId, setActiveSectionId] = useState(
    reportState.sections[0]?.id || 'objective'
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);

  // Checkpoint input
  const [checkpointLabel, setCheckpointLabel] = useState('');
  const [isCreatingCheckpoint, setIsCreatingCheckpoint] = useState(false);

  // Image Upload input
  const [imageCaption, setImageCaption] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const activeSection =
    reportState.sections.find((s) => s.id === activeSectionId) || reportState.sections[0];

  const handleContentChange = (newContent: string) => {
    const updatedSections = reportState.sections.map((s) =>
      s.id === activeSectionId ? { ...s, content: newContent } : s
    );
    const updated = { ...reportState, sections: updatedSections };
    onUpdateReportState(updated);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(png|jpe?g|webp)$/)) {
      setUploadError('Invalid format. Only PNG, JPG, and WEBP images are supported.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds the 5MB institutional limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      const curImages = activeSection.images || [];
      const updatedImages = [
        ...curImages,
        { base64Data, caption: imageCaption || file.name },
      ];

      const updatedSections = reportState.sections.map((s) =>
        s.id === activeSectionId ? { ...s, images: updatedImages } : s
      );

      onUpdateReportState({ ...reportState, sections: updatedSections });
      setImageCaption('');
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteImage = (imgIdx: number) => {
    const curImages = activeSection.images || [];
    const updatedImages = curImages.filter((_, idx) => idx !== imgIdx);
    const updatedSections = reportState.sections.map((s) =>
      s.id === activeSectionId ? { ...s, images: updatedImages } : s
    );
    onUpdateReportState({ ...reportState, sections: updatedSections });
  };

  const handleDeleteCodeSnapshot = (codeIdx: number) => {
    const curCode = activeSection.codeSnapshots || [];
    const updatedCode = curCode.filter((_, idx) => idx !== codeIdx);
    const updatedSections = reportState.sections.map((s) =>
      s.id === activeSectionId ? { ...s, codeSnapshots: updatedCode } : s
    );
    onUpdateReportState({ ...reportState, sections: updatedSections });
  };

  const handleDownloadDocx = async () => {
    setIsDownloadingDocx(true);
    try {
      const studentName = reportState.studentName?.trim() || user.name || 'Student';
      const studentId = reportState.studentId?.trim() || user.studentId || '';

      const res = await apiFetch(`/api/reports/${labId}/docx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.id,
          reportData: {
            ...reportState,
            studentName,
            studentId,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to generate Word report');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanName = studentName.replace(/[^a-zA-Z0-9]/g, '_') || 'Student';
      const cleanId = studentId.replace(/[^a-zA-Z0-9]/g, '_') || 'Submission';
      a.download = `MAI5124_Lab${String(labNumber).padStart(2, '0')}_${cleanId}_${cleanName}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  const handleSaveCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkpointLabel.trim()) return;
    await onCreateCheckpoint(checkpointLabel.trim(), reportState);
    setCheckpointLabel('');
    setIsCreatingCheckpoint(false);
  };

  return (
    <div className="h-full flex flex-col bg-slate-100">
      {/* Report Workspace Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-2xs">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-900 uppercase tracking-wider">
            <span>Academic Laboratory Report</span>
            <span>•</span>
            <span className="text-slate-500 font-mono">
              Lab {String(labNumber).padStart(2, '0')}
            </span>
          </div>
          <h2 className="text-sm font-bold text-slate-900">{reportState.title}</h2>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="text-slate-500 font-mono text-[11px]">{saveStatus}</span>

          <button
            onClick={() => setIsCreatingCheckpoint(true)}
            className="inline-flex items-center space-x-1 px-2.5 py-1 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded text-xs font-medium cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Checkpoint ({checkpoints.length})</span>
          </button>

          <button
            onClick={() => setIsPreviewOpen(true)}
            className="inline-flex items-center space-x-1 px-2.5 py-1 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded text-xs font-medium cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview Document</span>
          </button>

          <button
            onClick={handleDownloadDocx}
            disabled={isDownloadingDocx}
            className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>{isDownloadingDocx ? 'Generating DOCX...' : 'Download Word (.docx)'}</span>
          </button>
        </div>
      </div>

      {/* Main Report Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Section Navigation */}
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col p-3 overflow-y-auto space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 py-1 mb-1">
            Report Sections
          </div>
          {reportState.sections.map((section) => {
            const hasContent = Boolean(section.content && section.content.trim().length > 0);
            const hasAttachments =
              (section.codeSnapshots && section.codeSnapshots.length > 0) ||
              (section.images && section.images.length > 0);

            return (
              <button
                key={section.id}
                onClick={() => setActiveSectionId(section.id)}
                className={`w-full text-left px-3 py-2 rounded text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                  activeSectionId === section.id
                    ? 'bg-blue-50 text-blue-900 border border-blue-200 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="truncate">{section.title}</span>
                {hasContent ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />
                ) : (
                  <div className="w-2 h-2 rounded-full border border-slate-300 shrink-0 ml-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* Center Writing Canvas */}
        <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full space-y-6">
          {/* Author & Student Identification */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-blue-900" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Author & Student Identification
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                Printed on formal Word report (.docx)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Student Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={reportState.studentName || ''}
                  onChange={(e) =>
                    onUpdateReportState({ ...reportState, studentName: e.target.value })
                  }
                  placeholder="Enter your full name (e.g. John Doe)"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Student ID / Matriculation Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={reportState.studentId || ''}
                  onChange={(e) =>
                    onUpdateReportState({ ...reportState, studentId: e.target.value })
                  }
                  placeholder="Enter student ID (e.g. 24012345)"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900">{activeSection.title}</h3>
              <span className="text-[11px] text-slate-400 font-mono">Academic Text Box</span>
            </div>

            <textarea
              rows={8}
              value={activeSection.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Enter your technical analysis, experimental procedure, and conclusions for this section..."
              className="w-full text-xs text-slate-800 leading-relaxed outline-none resize-y font-sans p-1 border-0"
            />
          </div>

          {/* Section Evidence: Code Listings */}
          {activeSection.codeSnapshots && activeSection.codeSnapshots.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
              <div className="text-xs font-bold text-slate-900 mb-3 flex items-center space-x-1.5">
                <Code className="w-3.5 h-3.5 text-blue-900" />
                <span>Embedded Source Code Listings</span>
              </div>

              <div className="space-y-3">
                {activeSection.codeSnapshots.map((item, idx) => (
                  <div key={idx} className="border border-slate-200 rounded overflow-hidden">
                    <div className="bg-slate-100 px-3 py-1.5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{item.title}</span>
                      <button
                        onClick={() => handleDeleteCodeSnapshot(idx)}
                        className="text-slate-400 hover:text-red-600 cursor-pointer p-0.5"
                        title="Remove Code Listing"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <pre className="p-3 bg-slate-950 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-48">
                      {item.code}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section Evidence: Attached Figures & Plots */}
          {activeSection.images && activeSection.images.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
              <div className="text-xs font-bold text-slate-900 mb-3 flex items-center space-x-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-900" />
                <span>Embedded Scientific Figures & Plots</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSection.images.map((img, idx) => (
                  <div key={idx} className="border border-slate-200 rounded p-2.5 bg-slate-50 relative group">
                    <img
                      src={img.base64Data}
                      alt={img.caption || 'Figure'}
                      className="max-h-48 mx-auto rounded object-contain"
                    />
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 text-xs">
                      <span className="italic text-slate-600 line-clamp-1">{img.caption}</span>
                      <button
                        onClick={() => handleDeleteImage(idx)}
                        className="text-slate-400 hover:text-red-600 cursor-pointer p-1"
                        title="Delete Figure"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Screenshot / File Upload Box */}
          <div className="bg-white border border-dashed border-slate-300 rounded-lg p-5 text-center">
            <div className="max-w-md mx-auto space-y-3">
              <div className="flex justify-center">
                <div className="p-2 rounded-full bg-slate-100 text-slate-500">
                  <Upload className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">
                  Upload Screenshot / Supporting Evidence
                </h4>
                <p className="text-[11px] text-slate-500">
                  PNG, JPG, or WEBP up to 5MB. Embeds directly into this section and your Word DOCX.
                </p>
              </div>

              {uploadError && <div className="text-xs text-red-600">{uploadError}</div>}

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="Optional figure caption..."
                  className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded outline-none"
                />
                <label className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium cursor-pointer">
                  Browse File
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkpoint Modal */}
      {isCreatingCheckpoint && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-lg max-w-sm w-full p-5 shadow-lg">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
              Create Lab Report Checkpoint
            </h3>
            <p className="text-[11px] text-slate-500 mb-3">
              Save a named milestone of your current report and evidence state.
            </p>

            <form onSubmit={handleSaveCheckpoint} className="space-y-3">
              <input
                type="text"
                autoFocus
                required
                value={checkpointLabel}
                onChange={(e) => setCheckpointLabel(e.target.value)}
                placeholder="e.g. Checkpoint 1: Initial Findings"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded outline-none"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingCheckpoint(false)}
                  className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-slate-900 text-white text-xs font-medium rounded cursor-pointer"
                >
                  Save Checkpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Document Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col shadow-xl">
            <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Word Document Preview (.docx)</h3>
                <p className="text-[11px] text-slate-500">
                  MAI5124 AI in Software Engineering • {reportState.studentName || 'Open Access Student'}{' '}
                  {reportState.studentId ? `(${reportState.studentId})` : ''}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownloadDocx}
                  className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-900 text-white text-xs font-semibold rounded cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Download .docx</span>
                </button>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="px-2 py-1 text-slate-500 hover:text-slate-800 text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 text-xs text-slate-800 leading-relaxed font-sans bg-slate-50/50">
              <div className="text-center pb-4 border-b border-slate-200">
                <div className="font-semibold text-blue-900 uppercase tracking-wider text-[11px]">
                  MAI5124 AI in Software Engineering
                </div>
                <h1 className="text-base font-bold text-slate-900 mt-1">
                  Lab {String(labNumber).padStart(2, '0')}: {labTitle}
                </h1>
                <div className="text-slate-500 mt-1">
                  Author: {reportState.studentName || 'Open Access Student'} | Student ID:{' '}
                  {reportState.studentId || 'N/A'} | Date:{' '}
                  {new Date().toLocaleDateString('en-GB')}
                </div>
              </div>

              {reportState.sections.map((sec) => (
                <div key={sec.id} className="space-y-2">
                  <h4 className="font-bold text-blue-900 border-b border-slate-200 pb-1">
                    {sec.title}
                  </h4>
                  <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                    {sec.content || <span className="italic text-slate-400">Empty section</span>}
                  </p>
                  {sec.codeSnapshots &&
                    sec.codeSnapshots.map((c, i) => (
                      <pre
                        key={i}
                        className="p-2.5 bg-slate-900 text-slate-100 font-mono text-[11px] rounded"
                      >
                        {c.code}
                      </pre>
                    ))}
                  {sec.images &&
                    sec.images.map((img, i) => (
                      <div key={i} className="text-center my-3">
                        <img
                          src={img.base64Data}
                          alt="preview"
                          className="max-h-48 mx-auto rounded border"
                        />
                        {img.caption && (
                          <p className="text-[11px] text-slate-500 italic mt-1">{img.caption}</p>
                        )}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
