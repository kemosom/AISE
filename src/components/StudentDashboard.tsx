import React from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Code2,
  Lock,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import type { AuthUserPublic } from '../../lib/auth/types';

export interface LabTaskDetail {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  category?: 'code' | 'design' | 'test' | 'report' | 'submission' | string;
}

export interface LabSummary {
  id: string;
  labNumber: number;
  week: number;
  title: string;
  shortDescription: string;
  estimatedDuration?: string;
  isUnlocked: boolean;
  isPublished: boolean;
  status: 'Locked' | 'Available' | 'In Progress' | 'Completed' | 'Submitted';
  progressPercentage: number;
  completedTasks?: number;
  totalTasks?: number;
  tasks?: LabTaskDetail[];
  isSubmitted?: boolean;
  submittedAt?: string | null;
  lastOpenedAt?: string;
  deadline?: string;
  examMode?: boolean;
}

interface StudentDashboardProps {
  user: AuthUserPublic;
  labs: LabSummary[];
  onSelectLab: (labId: string) => void;
  onRefresh: () => void;
  error?: string | null;
  isLoading?: boolean;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  labs,
  onSelectLab,
  onRefresh,
  error,
  isLoading,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-5 sm:px-8 py-10">
      <section className="mb-10">
        <p className="text-xs font-semibold tracking-[0.16em] uppercase text-blue-900 mb-2">
          MAI5124 · AI in Software Engineering
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-950">
          Interactive Laboratory Modules
        </h1>
        <p className="mt-3 max-w-2xl text-sm sm:text-base leading-7 text-slate-600">
          Start with the theory and laboratory sheet. You can annotate the reading,
          export your notes, then continue directly into the coding, visual design,
          testing, and report workspace.
        </p>

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            Theory & annotated lab sheet
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5" />
            In-browser Python workspace
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Tests & integrated report
          </span>
        </div>
      </section>

      {error && (
        <div className="mb-6 border border-red-200 bg-red-50 rounded-md px-4 py-3 flex items-start justify-between gap-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-900">Unable to load laboratory modules.</p>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-red-800 hover:text-red-950"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {isLoading && (
        <div className="py-12 text-sm text-slate-500">Loading laboratory modules…</div>
      )}

      {!isLoading && !error && labs.length === 0 && (
        <div className="border border-slate-200 rounded-md p-6 text-sm text-slate-600">
          No laboratory modules are available yet.
        </div>
      )}

      {!isLoading && labs.length > 0 && (
        <div className="border-t border-slate-200">
          {labs.map((lab) => {
            const unlocked = lab.isUnlocked;
            const submitted =
              lab.status === 'Submitted' || lab.status === 'Completed' || lab.isSubmitted;
            const isExam = lab.examMode || lab.labNumber === 12;

            return (
              <article
                key={lab.id}
                className="border-b border-slate-200 py-6 grid grid-cols-1 sm:grid-cols-[92px_1fr_auto] gap-3 sm:gap-6 items-start"
              >
                <div>
                  <span className="font-mono text-xs text-slate-500">
                    {isExam ? 'EXAM' : `LAB ${String(lab.labNumber).padStart(2, '0')}`}
                  </span>
                  {lab.estimatedDuration && (
                    <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock3 className="w-3 h-3" />
                      {lab.estimatedDuration}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className={`text-base font-semibold ${unlocked ? 'text-slate-950' : 'text-slate-500'}`}>
                      {lab.title}
                    </h2>
                    {submitted && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                        Completed
                      </span>
                    )}
                  </div>
                  <p className={`mt-1 text-sm leading-6 max-w-2xl ${unlocked ? 'text-slate-600' : 'text-slate-400'}`}>
                    {lab.shortDescription}
                  </p>
                </div>

                <div className="sm:pt-1">
                  {unlocked ? (
                    <button
                      type="button"
                      onClick={() => onSelectLab(lab.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-slate-950 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                    >
                      {submitted ? 'Review Lab' : 'Open Lab'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                      Coming later
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="mt-8 text-xs leading-5 text-slate-400">
        Open-access mode stores your working code, report draft, annotations, and visual
        design in this browser. Use the export functions if you move to another computer
        or clear browser data.
      </p>
    </div>
  );
};
