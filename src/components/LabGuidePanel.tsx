import React from 'react';
import { BookOpen, CheckSquare, ListChecks } from 'lucide-react';

interface LabGuidePanelProps {
  instructionsMarkdown: string;
  learningOutcomes: string[];
}

export const LabGuidePanel: React.FC<LabGuidePanelProps> = ({
  instructionsMarkdown,
  learningOutcomes,
}) => {
  return (
    <div className="h-full flex flex-col bg-white border-r border-slate-200">
      <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5 text-blue-900" />
          <span>Laboratory Guide</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">MAI5124 Module</span>
      </div>

      <div className="flex-1 overflow-y-auto p-5 text-xs text-slate-700 leading-relaxed space-y-6">
        {/* Rendered Markdown Guide */}
        <div className="prose prose-xs max-w-none text-slate-700">
          {instructionsMarkdown.split('\n\n').map((paragraph, idx) => {
            const trimmed = paragraph.trim();

            if (trimmed.startsWith('# ')) {
              return (
                <h1 key={idx} className="text-base font-bold text-slate-900 mb-2 border-b border-slate-200 pb-1.5">
                  {trimmed.replace(/^# /, '')}
                </h1>
              );
            }
            if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
              return (
                <h2 key={idx} className="text-xs font-bold text-blue-900 uppercase tracking-wider mt-4 mb-2">
                  {trimmed.replace(/^###? /, '')}
                </h2>
              );
            }
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
              const items = trimmed.split('\n').map((l) => l.replace(/^[-*]\s+/, ''));
              return (
                <ul key={idx} className="list-disc pl-4 space-y-1 text-xs text-slate-600 my-2">
                  {items.map((item, itemIdx) => (
                    <li key={itemIdx}>{item}</li>
                  ))}
                </ul>
              );
            }
            if (trimmed.startsWith('```')) {
              const codeContent = trimmed.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');
              return (
                <pre key={idx} className="p-3 bg-slate-900 text-slate-100 font-mono text-[11px] rounded my-2 overflow-x-auto">
                  {codeContent}
                </pre>
              );
            }

            return (
              <p key={idx} className="text-xs leading-relaxed text-slate-700">
                {trimmed}
              </p>
            );
          })}
        </div>

        {/* Learning Outcomes Box */}
        {learningOutcomes && learningOutcomes.length > 0 && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              <ListChecks className="w-3.5 h-3.5 text-blue-900" />
              <span>Target Competencies</span>
            </div>
            <ul className="space-y-1.5">
              {learningOutcomes.map((outcome, oIdx) => (
                <li key={oIdx} className="flex items-start space-x-2 text-[11px] text-slate-600">
                  <span className="text-blue-900 font-bold">•</span>
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
