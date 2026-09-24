import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Send, FileCheck } from 'lucide-react';

interface SubmitLabModalProps {
  labNumber: number;
  labTitle: string;
  testPassedCount: number;
  totalTests: number;
  reportSectionsFilled: number;
  totalReportSections: number;
  onConfirmSubmit: () => Promise<void>;
  onClose: () => void;
}

export const SubmitLabModal: React.FC<SubmitLabModalProps> = ({
  labNumber,
  labTitle,
  testPassedCount,
  totalTests,
  reportSectionsFilled,
  totalReportSections,
  onConfirmSubmit,
  onClose,
}) => {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onConfirmSubmit();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Submission error');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Submit Lab {String(labNumber).padStart(2, '0')}: {labTitle}
            </h3>
            <p className="text-xs text-slate-500">Formal Academic Assessment Record</p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-2.5 mb-5">
          <div className="font-semibold text-slate-700">Pre-Submission Verification Checklist:</div>

          <div className="flex items-center justify-between">
            <span className="text-slate-600">Automated Public Tests:</span>
            <span className="font-semibold text-emerald-700 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {testPassedCount} / {totalTests} Passed
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-600">Technical Report Sections:</span>
            <span className="font-semibold text-slate-800">
              {reportSectionsFilled} of {totalReportSections} Documented
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-600">Snapshot Integrity:</span>
            <span className="text-slate-500">Source Code & Visual Design Preserved</span>
          </div>
        </div>

        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800 flex items-start space-x-2 mb-5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <span>
            Upon submission, an immutable snapshot of your code, test logs, visual diagrams, and Word
            report will be archived for lecturer grading.
          </span>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Archiving Submission...' : 'Confirm Submission'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
