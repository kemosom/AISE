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
const SUNWAY_LOGO = 'https://www.clipartmax.com/png/middle/295-2951754_sunway-college-sunway-university-malaysia-logo.png';
const FCRI_LOGO = 'data:image/webp;base64,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';

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  labs,
  onSelectLab,
  onRefresh,
  error,
  isLoading,
}) => {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const cursorGlowRef = useRef<HTMLDivElement | null>(null);
  const orbARef = useRef<HTMLDivElement | null>(null);
  const orbBRef = useRef<HTMLDivElement | null>(null);
  const orbCRef = useRef<HTMLDivElement | null>(null);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const width = window.innerWidth || 1;
    const height = window.innerHeight || 1;
    const x = event.clientX / width - 0.5;
    const y = event.clientY / height - 0.5;

    if (cursorGlowRef.current) {
      cursorGlowRef.current.style.left = `${event.clientX}px`;
      cursorGlowRef.current.style.top = `${event.clientY}px`;
    }

    if (orbARef.current) {
      orbARef.current.style.transform =
        `translate3d(${x * 70}px, ${y * 52}px, 0)`;
    }

    if (orbBRef.current) {
      orbBRef.current.style.transform =
        `translate3d(${x * -52}px, ${y * -38}px, 0)`;
    }

    if (orbCRef.current) {
      orbCRef.current.style.transform =
        `translate3d(${x * 36}px, ${y * -30}px, 0)`;
    }
  };

  const resetParallax = () => {
    if (cursorGlowRef.current) {
      cursorGlowRef.current.style.left = '68%';
      cursorGlowRef.current.style.top = '32%';
    }

    [orbARef, orbBRef, orbCRef].forEach((ref) => {
      if (ref.current) {
        ref.current.style.transform = 'translate3d(0, 0, 0)';
      }
    });
  };

  return (
    <div
      ref={pageRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetParallax}
      className="relative isolate min-h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-50"
    >
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          ref={cursorGlowRef}
          className="absolute h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-300/18 blur-3xl transition-[left,top] duration-100 ease-out"
          style={{ left: '68%', top: '32%' }}
        />
        <div
          ref={orbARef}
          className="absolute -right-28 top-12 h-80 w-80 rounded-full border border-blue-200/70 bg-blue-100/45 transition-transform duration-300 ease-out"
        />
        <div
          ref={orbBRef}
          className="absolute -left-24 top-[42%] h-72 w-72 rounded-full border border-cyan-100 bg-cyan-50/75 transition-transform duration-300 ease-out"
        />
        <div
          ref={orbCRef}
          className="absolute bottom-[-7rem] right-[16%] h-80 w-80 rounded-full border border-indigo-100 bg-indigo-50/65 transition-transform duration-300 ease-out"
        />
        <div className="absolute left-[12%] top-[18%] h-20 w-20 rounded-full border border-blue-200/70" />
        <div className="absolute right-[21%] top-[58%] h-28 w-28 rounded-full border border-slate-200/80" />
        <div
          className="absolute inset-0 opacity-[0.26]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(59,130,246,0.16) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
        <section className="mb-10 rounded-2xl border border-slate-200/90 bg-white/82 px-6 py-8 shadow-sm backdrop-blur-md sm:px-8 sm:py-10">
          <a
            href={SUNWAY_URL}
            target="_blank"
            rel="noreferrer"
            className="mb-7 inline-flex"
            title="Sunway University"
          >
            <img
              src={SUNWAY_LOGO}
              alt="Sunway University"
              className="h-auto w-52 object-contain sm:w-56"
            />
          </a>

          <p className="text-xs font-semibold tracking-[0.16em] uppercase text-blue-900 mb-1">
            MAI5124 · AI in Software Engineering
          </p>
          <p className="text-xs font-medium text-slate-500 mb-3">
            Sunway University · Faculty of Engineering and Technology
          </p>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Interactive Laboratory Modules
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
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
        </section>

        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-md border border-red-200 bg-red-50/95 px-4 py-3 backdrop-blur">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  Unable to load laboratory modules.
                </p>
                <p className="mt-1 text-xs text-red-700">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-red-800 hover:text-red-950"
            >
              <RefreshCw className="h-3.5 w-3.5" />
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
          <div className="rounded-md border border-slate-200 bg-white/80 p-6 text-sm text-slate-600 backdrop-blur">
            No laboratory modules are available yet.
          </div>
        )}

        {!isLoading && labs.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white/72 shadow-sm backdrop-blur-md">
            {labs.map((lab, index) => {
              const unlocked = lab.isUnlocked;
              const submitted =
                lab.status === 'Submitted' ||
                lab.status === 'Completed' ||
                lab.isSubmitted;
              const isExam = lab.examMode || lab.labNumber === 12;

              return (
                <article
                  key={lab.id}
                  className={`grid grid-cols-1 items-start gap-3 px-5 py-6 transition-colors hover:bg-white/70 sm:grid-cols-[92px_1fr_auto] sm:gap-6 sm:px-6 ${
                    index < labs.length - 1 ? 'border-b border-slate-200/90' : ''
                  }`}
                >
                  <div>
                    <span className="font-mono text-xs text-slate-500">
                      {isExam
                        ? 'EXAM'
                        : `LAB ${String(lab.labNumber).padStart(2, '0')}`}
                    </span>
                    {lab.estimatedDuration && (
                      <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock3 className="h-3 w-3" />
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
                      className={`mt-1 max-w-2xl text-sm leading-6 ${
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
                        className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
                      >
                        {submitted ? 'Review Lab' : 'Open Lab'}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-slate-400">
                        <Lock className="h-3.5 w-3.5" />
                        Coming later
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <footer className="mt-12 rounded-2xl border border-slate-200/90 bg-white/72 px-5 py-5 shadow-sm backdrop-blur-md sm:px-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <img
                src={FCRI_LOGO}
                alt="Future Cities Research Institute"
                className="h-auto w-40 shrink-0 object-contain sm:w-44"
              />

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
                <p className="mt-1 max-w-xl text-[11px] leading-5 text-slate-400">
                  Post-Doctoral Research Fellow · Faculty of Engineering and Technology,
                  School of Engineering · Sunway University
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <a
                href={PERSONAL_WEBSITE_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-900"
              >
                dr-abdikarim.com
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href={STAFF_PROFILE_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-900"
              >
                Sunway staff profile
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
