import React from 'react';
import {
  Check,
  ChevronRight,
  Code2,
  FileText,
  ListChecks,
  Play,
  ShieldCheck,
} from 'lucide-react';
import type { LabManifest } from '../../labs/types';

interface LabStepsPanelProps {
  manifest: LabManifest;
  completedStepIds: string[];
  onToggleStep: (stepId: string) => void;
  onOpenCode: () => void;
  onOpenReport: () => void;
  onOpenVerification: () => void;
}

export const LabStepsPanel: React.FC<LabStepsPanelProps> = ({
  manifest,
  completedStepIds,
  onToggleStep,
  onOpenCode,
  onOpenReport,
  onOpenVerification,
}) => {
  const tasks = manifest.tasks || [];

  const actionFor = (category?: string) => {
    if (category === 'report') {
      return {
        label: 'Open Report',
        icon: <FileText className="w-3.5 h-3.5" />,
        onClick: onOpenReport,
      };
    }

    if (category === 'test') {
      return {
        label: 'Open Code + Verify',
        icon: <ShieldCheck className="w-3.5 h-3.5" />,
        onClick: onOpenVerification,
      };
    }

    if (category === 'code' || category === 'analysis') {
      return {
        label: 'Open Code',
        icon: category === 'code'
          ? <Code2 className="w-3.5 h-3.5" />
          : <Play className="w-3.5 h-3.5" />,
        onClick: onOpenCode,
      };
    }

    return null;
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-900">
            <ListChecks className="w-4 h-4" />
            Lab 01 workflow
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Do these steps in order
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            You do not need any visual-design tool. Read the decision problem,
            run the supplied baseline, implement one function, verify the
            requirements, then complete the report.
          </p>
        </div>

        {manifest.courseAlignment && manifest.courseAlignment.length > 0 && (
          <div className="mb-6 rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Course alignment
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {manifest.courseAlignment.map((item) => (
                <span
                  key={`${item.clo}-${item.plo}`}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                  title={item.evidence}
                >
                  <strong>{item.clo} → {item.plo}</strong>
                  <span className="ml-1 text-slate-500">({item.contribution})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {tasks.map((task, index) => {
            const complete = completedStepIds.includes(task.id);
            const action = actionFor(task.category);

            return (
              <section
                key={task.id}
                className={`rounded-lg border bg-white p-4 transition-colors ${
                  complete ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <button
                    type="button"
                    onClick={() => onToggleStep(task.id)}
                    className={`mt-0.5 w-7 h-7 shrink-0 rounded-full border flex items-center justify-center text-xs font-bold transition-colors ${
                      complete
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white border-slate-300 text-slate-600 hover:border-slate-500'
                    }`}
                    aria-label={complete ? 'Mark step incomplete' : 'Mark step complete'}
                  >
                    {complete ? <Check className="w-4 h-4" /> : index + 1}
                  </button>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-slate-950">
                      {task.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {task.description}
                    </p>
                  </div>

                  {action && (
                    <button
                      type="button"
                      onClick={action.onClick}
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {action.icon}
                      {action.label}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-950">
          <strong>Important:</strong> the goal is not to write a large amount of
          Python. The goal is to justify an AI/software-engineering integration
          choice, implement the selected control logic, and interpret the
          evidence produced by the system.
        </div>
      </div>
    </div>
  );
};
