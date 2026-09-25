import React, { useRef } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Code2,
  ExternalLink,
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

const STAFF_PROFILE_URL =
  'https://sunwayuniversity.edu.my/school-of-engineering/staff-profiles/dr-abdikarim-mohamed-ibrahim';
const PERSONAL_WEBSITE_URL = 'https://dr-abdikarim.com/';
const SUNWAY_URL = 'https://sunwayuniversity.edu.my/';

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  labs,
  onSelectLab,
  onRefresh,
  error,
  isLoading,
}) => {
  const heroRef = useRef<HTMLElement | null>(null);
  const cursorGlowRef = useRef<HTMLDivElement | null>(null);
  const orbARef = useRef<HTMLDivElement | null>(null);
  const orbBRef = useRef<HTMLDivElement | null>(null);

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const hero = heroRef.current;
    if (!hero) return;

    const rect = hero.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    if (cursorGlowRef.current) {
      cursorGlowRef.current.style.left = `${event.clientX - rect.left}px`;
      cursorGlowRef.current.style.top = `${event.clientY - rect.top}px`;
    }

    if (orbARef.current) {
      orbARef.current.style.transform =
        `translate3d(${x * 34}px, ${y * 24}px, 0)`;
    }

    if (orbBRef.current) {
      orbBRef.current.style.transform =
        `translate3d(${x * -22}px, ${y * -18}px, 0)`;
    }
  };

  const resetParallax = () => {
    if (cursorGlowRef.current) {
      cursorGlowRef.current.style.left = '72%';
      cursorGlowRef.current.style.top = '34%';
    }
    if (orbARef.current) {
      orbARef.current.style.transform = 'translate3d(0, 0, 0)';
    }
    if (orbBRef.current) {
      orbBRef.current.style.transform = 'translate3d(0, 0, 0)';
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-5 sm:px-8 py-10">
      <section
        ref={heroRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetParallax}
        className="relative mb-10 overflow-hidden rounded-2xl border border-slate-200 bg-white px-6 py-8 sm:px-8 sm:py-10 shadow-sm"
      >
        <div
          ref={cursorGlowRef}
          className="pointer-events-none absolute z-0 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-300/20 blur-3xl transition-[left,top] duration-150 ease-out"
          style={{ left: '72%', top: '34%' }}
        />
        <div
          ref={orbARef}
          className="pointer-events-none absolute -right-16 -top-20 z-0 h-56 w-56 rounded-full border border-blue-200/70 bg-blue-100/50 blur-[1px] transition-transform duration-300 ease-out"
        />
        <div
          ref={orbBRef}
          className="pointer-events-none absolute -bottom-24 right-28 z-0 h-48 w-48 rounded-full border border-cyan-100 bg-cyan-50/70 transition-transform duration-300 ease-out"
        />
        <div className="pointer-events-none absolute right-14 top-9 z-0 h-24 w-24 rounded-full border border-slate-200/80" />
        <div className="pointer-events-none absolute right-20 top-15 z-0 h-12 w-12 rounded-full border border-blue-200/80" />

        <div className="relative z-10">
          <a
            href={SUNWAY_URL}
            target="_blank"
            rel="noreferrer"
            className="mb-6 inline-flex items-center gap-3 rounded-lg border border-slate-200 bg-white/85 px-3 py-2 shadow-sm backdrop-blur"
            title="Sunway University"
          >
            <img
              src="https://sunwayuniversity.edu.my/favicon.ico"
              alt="Sunway University logo"
              className="h-9 w-9 object-contain"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
            <div className="leading-tight">
              <div className="text-[11px] font-bold tracking-[0.16em] text-slate-950">
                SUNWAY UNIVERSITY
              </div>
              <div className="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-slate-400">
                Faculty of Engineering and Technology
              </div>
            </div>
          </a>

          <p className="text-xs font-semibold tracking-[0.16em] uppercase text-blue-900 mb-1">
            MAI5124 · AI in Software Engineering
          </p>
          <p className="text-xs font-medium text-slate-500 mb-3">
            Sunway University · Faculty of Engineering and Technology
          </p>

          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-950">
            Interactive Laboratory Modules
          </h1>

          <p className="mt-3 max-w-2xl text-sm sm:text-base leading-7 text-slate-600">
            Start with the theory and laboratory sheet, follow the guided steps,
            work directly in the Python workspace, verify the requirements, and
            complete the integrated technical report.
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
              Requirement verification & report
            </span>
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-6 border border-red-200 bg-red-50 rounded-md px-4 py-3 flex items-start justify-between gap-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-900">
                Unable to load laboratory modules.
              </p>
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
        <div className="py-12 text-sm text-slate-500">
          Loading laboratory modules…
        </div>
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
              lab.status === 'Submitted' ||
              lab.status === 'Completed' ||
              lab.isSubmitted;
            const isExam = lab.examMode || lab.labNumber === 12;

            return (
              <article
                key={lab.id}
                className="border-b border-slate-200 py-6 grid grid-cols-1 sm:grid-cols-[92px_1fr_auto] gap-3 sm:gap-6 items-start"
              >
                <div>
                  <span className="font-mono text-xs text-slate-500">
                    {isExam
                      ? 'EXAM'
                      : `LAB ${String(lab.labNumber).padStart(2, '0')}`}
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
                    <h2
                      className={`text-base font-semibold ${
                        unlocked ? 'text-slate-950' : 'text-slate-500'
                      }`}
                    >
                      {lab.title}
                    </h2>
                    {submitted && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                        Completed
                      </span>
                    )}
                  </div>
                  <p
                    className={`mt-1 text-sm leading-6 max-w-2xl ${
                      unlocked ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
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

      <footer className="mt-12 border-t border-slate-200 pt-6 pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs text-slate-500">
              © 2026{' '}
              <a
                href={STAFF_PROFILE_URL}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-slate-800 hover:text-blue-900 hover:underline"
              >
                Dr Abdikarim Mohamed Ibrahim
              </a>
            </p>
            <p className="mt-1 max-w-2xl text-[11px] leading-5 text-slate-400">
              Post-Doctoral Research Fellow · Faculty of Engineering and Technology,
              School of Engineering · Sunway University
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <a
              href={PERSONAL_WEBSITE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-900"
            >
              dr-abdikarim.com
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={STAFF_PROFILE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-900"
            >
              Sunway staff profile
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
