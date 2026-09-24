import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileText,
  AlertTriangle,
  PlayCircle,
  Award,
  ListChecks,
  ChevronDown,
  ChevronUp,
  Circle,
  RefreshCw,
} from 'lucide-react';
import type { AuthUserPublic } from '../../lib/auth/types';
import { apiClient } from '../lib/api-client';

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
  user,
  labs,
  onSelectLab,
  onRefresh,
  error,
  isLoading,
}) => {
  const [lockedModalLab, setLockedModalLab] = useState<LabSummary | null>(null);
  const [expandedLabTasks, setExpandedLabTasks] = useState<Record<string, boolean>>({});
  const [liveProgressData, setLiveProgressData] = useState<
    Record<string, { completedTasks: number; totalTasks: number; tasks: LabTaskDetail[] }>
  >({});
  const [fetchingLabId, setFetchingLabId] = useState<string | null>(null);

  const completedCount = labs.filter(
    (l) => l.status === 'Submitted' || l.status === 'Completed' || l.isSubmitted
  ).length;
  const inProgressCount = labs.filter(
    (l) => l.status === 'In Progress' && !l.isSubmitted
  ).length;
  const overallPercentage = Math.round((completedCount / (labs.length || 1)) * 100);

  // Calculate total course-wide tasks completed vs total
  const totalCourseTasks = labs.reduce((acc, lab) => {
    const live = liveProgressData[lab.id];
    return acc + (live?.totalTasks ?? lab.totalTasks ?? 5);
  }, 0);

  const completedCourseTasks = labs.reduce((acc, lab) => {
    const live = liveProgressData[lab.id];
    const isSub = lab.status === 'Submitted' || lab.status === 'Completed' || lab.isSubmitted;
    const tot = live?.totalTasks ?? lab.totalTasks ?? 5;
    if (isSub) return acc + tot;
    return acc + (live?.completedTasks ?? lab.completedTasks ?? 0);
  }, 0);

  const taskCompletionPercentage = totalCourseTasks > 0
    ? Math.round((completedCourseTasks / totalCourseTasks) * 100)
    : 0;

  const handleLabClick = (lab: LabSummary) => {
    if (!lab.isUnlocked) {
      setLockedModalLab(lab);
      return;
    }
    onSelectLab(lab.id);
  };

  const fetchLiveProgress = async (labId: string) => {
    try {
      setFetchingLabId(labId);
      const data = await apiClient.get(`/api/labs/${labId}/progress`);
      setLiveProgressData((prev) => ({
        ...prev,
        [labId]: {
          completedTasks: data.completedTasks,
          totalTasks: data.totalTasks,
          tasks: data.tasks || [],
        },
      }));
    } catch (e) {
      console.error('Failed to load lab progress', e);
    } finally {
      setFetchingLabId(null);
    }
  };

  const toggleTaskBreakdown = (labId: string) => {
    setExpandedLabTasks((prev) => {
      const nextState = !prev[labId];
      if (nextState && !liveProgressData[labId]) {
        fetchLiveProgress(labId);
      }
      return { ...prev, [labId]: nextState };
    });
  };

  const getStatusBadge = (status: LabSummary['status'], isUnlocked: boolean, isSubmitted?: boolean) => {
    if (!isUnlocked) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
          <Lock className="w-3 h-3 text-slate-400" />
          <span>Locked</span>
        </span>
      );
    }
    if (isSubmitted || status === 'Submitted') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Submitted</span>
        </span>
      );
    }
    switch (status) {
      case 'In Progress':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" />
            <span>In Progress</span>
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Completed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <Unlock className="w-3 h-3 text-slate-500" />
            <span>Available</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Course Header Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-900 tracking-wider uppercase mb-1">
            <span>Sunway University</span>
            <span>•</span>
            <span>Department of Computing</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            MAI5124: Artificial Intelligence in Software Engineering
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Open Academic Laboratory Suite. Read theory and labsheets with interactive pen, highlighter, and sticky notes, code in Python with in-browser execution, and generate formal Word reports.
          </p>
        </div>

        {/* Course Progress Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 min-w-[300px] shrink-0">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
            <span className="flex items-center gap-1.5">
              <ListChecks className="w-4 h-4 text-blue-900" />
              <span>Course Progress</span>
            </span>
            <span className="font-mono font-bold text-blue-950">
              {completedCourseTasks} / {totalCourseTasks} Tasks ({taskCompletionPercentage}%)
            </span>
          </div>

          {/* Granular Task Multi-segment or Continuous Progress Bar */}
          <div className="w-full bg-slate-200 rounded-full h-2 mb-2 overflow-hidden">
            <div
              className="bg-blue-900 h-2 rounded-full transition-all duration-300"
              style={{ width: `${taskCompletionPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>{completedCount} submitted</span>
            <span>{inProgressCount} in progress</span>
            <span>{labs.length} modules</span>
          </div>
        </div>
      </div>

      {/* Error Notification Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-900">Unable to load laboratory modules.</h3>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold cursor-pointer shrink-0 ml-4 flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Empty State when no error but 0 labs */}
      {!isLoading && !error && labs.length === 0 && (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-lg mb-6">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">Unable to load laboratory modules.</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">No laboratory records could be loaded from the academic session.</p>
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold cursor-pointer inline-flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Laboratory Modules Section */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Laboratory Modules
          </h2>
          <p className="text-xs text-slate-500">
            Complete the assigned laboratory tasks, automated test runs, and integrated technical report.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-1.5 rounded transition-colors cursor-pointer"
          title="Refresh lab statuses"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Laboratories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {labs.map((lab) => {
          const isUnlocked = lab.isUnlocked;
          const isExam = lab.examMode || lab.labNumber === 12;
          const isSubmitted = lab.status === 'Submitted' || lab.status === 'Completed' || lab.isSubmitted;
          const live = liveProgressData[lab.id];

          const totalTasks = live?.totalTasks ?? lab.totalTasks ?? lab.tasks?.length ?? 5;
          const completedTasks = isSubmitted
            ? totalTasks
            : (live?.completedTasks ?? lab.completedTasks ?? (lab.progressPercentage > 0 ? Math.max(1, Math.round((lab.progressPercentage / 100) * totalTasks)) : 0));

          const taskPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
          const isExpanded = !!expandedLabTasks[lab.id];

          const taskList: LabTaskDetail[] = live?.tasks ?? lab.tasks ?? (
            Array.from({ length: totalTasks }).map((_, i) => ({
              id: `${lab.id}-t${i + 1}`,
              title: `Task ${i + 1}: ${
                i === 0
                  ? 'Starter Architecture & Code'
                  : i === 1
                  ? 'Core AI Logic Formulation'
                  : i === 2
                  ? 'Visual Pipeline Design'
                  : i === 3
                  ? 'Automated Test Harness'
                  : 'Technical Report & Submission'
              }`,
              description:
                i === 0
                  ? 'Review initial codebase and starter structures'
                  : i === 1
                  ? 'Formulate core algorithmic logic and processing pipeline'
                  : i === 2
                  ? 'Model visual graph or interaction nodes'
                  : i === 3
                  ? 'Execute assertion test suite and verify invariants'
                  : 'Document analytical findings and submit final lab',
              completed: isSubmitted || i < completedTasks,
              category: (i === 0 || i === 1 ? 'code' : i === 2 ? 'design' : i === 3 ? 'test' : 'submission') as any,
            }))
          );

          return (
            <div
              key={lab.id}
              onClick={() => handleLabClick(lab)}
              className={`border rounded-lg p-5 flex flex-col justify-between transition-all ${
                isUnlocked
                  ? 'bg-white border-slate-200 hover:border-slate-400 hover:shadow-xs cursor-pointer'
                  : 'bg-slate-50/70 border-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <div>
                {/* Top Lab Meta */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {isExam ? 'EXAM' : `Lab ${String(lab.labNumber).padStart(2, '0')}`}
                    </span>
                    {isExam && (
                      <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 flex items-center space-x-1">
                        <Award className="w-3 h-3" />
                        <span>Examination</span>
                      </span>
                    )}
                  </div>
                  {getStatusBadge(lab.status, isUnlocked, isSubmitted)}
                </div>

                {/* Lab Title & Description */}
                <h3
                  className={`text-sm font-semibold line-clamp-1 mb-1.5 ${
                    isUnlocked ? 'text-slate-900' : 'text-slate-500'
                  }`}
                >
                  {lab.title}
                </h3>
                <p
                  className={`text-xs line-clamp-2 leading-relaxed mb-4 ${
                    isUnlocked ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  {lab.shortDescription}
                </p>

                {/* VISUAL PROGRESS INDICATOR: Completed Tasks vs Total Tasks */}
                <div
                  className={`p-3 rounded-lg border mb-3 transition-colors ${
                    isSubmitted
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : isUnlocked
                      ? completedTasks > 0
                        ? 'bg-blue-50/50 border-blue-200'
                        : 'bg-slate-50 border-slate-200'
                      : 'bg-slate-100/50 border-slate-200 text-slate-400'
                  }`}
                >
                  {/* Task Header Counter */}
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold flex items-center gap-1.5">
                      {isSubmitted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : isUnlocked ? (
                        <ListChecks className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      ) : (
                        <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                      )}
                      <span className={isSubmitted ? 'text-emerald-900' : isUnlocked ? 'text-slate-800' : 'text-slate-500'}>
                        {isSubmitted
                          ? 'All Tasks Completed'
                          : isUnlocked
                          ? 'Module Tasks'
                          : 'Tasks Restricted'}
                      </span>
                    </span>

                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                        isSubmitted
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : isUnlocked
                          ? completedTasks > 0
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-slate-200/80 text-slate-700 border-slate-300'
                          : 'bg-slate-200/50 text-slate-400 border-slate-300'
                      }`}
                    >
                      {completedTasks} / {totalTasks} Tasks
                    </span>
                  </div>

                  {/* Multi-Segment Discrete Task Progress Indicator */}
                  <div className="flex items-center gap-1 w-full my-2">
                    {taskList.map((task, idx) => {
                      const isDone = isSubmitted || task.completed;
                      return (
                        <div
                          key={task.id || idx}
                          className={`h-2 flex-1 rounded-xs transition-all duration-300 relative group/seg ${
                            !isUnlocked
                              ? 'bg-slate-300/60'
                              : isDone
                              ? isSubmitted
                                ? 'bg-emerald-600 shadow-xs'
                                : 'bg-blue-600 shadow-xs'
                              : 'bg-slate-300 hover:bg-slate-400'
                          }`}
                          title={`${task.title} (${isDone ? 'Completed' : 'Pending'})`}
                        >
                          {/* Tooltip on hover */}
                          <div className="opacity-0 group-hover/seg:opacity-100 pointer-events-none absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded whitespace-nowrap z-30 shadow-lg transition-opacity flex items-center gap-1">
                            <span>{isDone ? '✓' : '○'}</span>
                            <span className="font-medium">{task.title}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Sub-label and percentage */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>
                      {isSubmitted
                        ? '100% Verified'
                        : isUnlocked
                        ? `${taskPercentage}% completed`
                        : 'Unlock required'}
                    </span>

                    {/* Expandable Task Breakdown Toggle */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskBreakdown(lab.id);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-blue-900 transition-colors cursor-pointer hover:underline"
                    >
                      <span>{isExpanded ? 'Hide' : 'Details'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  {/* Expandable Task Checklist Details */}
                  {isExpanded && (
                    <div
                      className="mt-2.5 pt-2.5 border-t border-slate-200/80 space-y-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider px-0.5">
                        <span>Task Breakdown</span>
                        <button
                          onClick={() => fetchLiveProgress(lab.id)}
                          title="Sync live status from progress endpoint"
                          className="flex items-center gap-1 text-[10px] text-blue-700 hover:text-blue-900 cursor-pointer"
                        >
                          <RefreshCw
                            className={`w-2.5 h-2.5 ${fetchingLabId === lab.id ? 'animate-spin' : ''}`}
                          />
                          <span>Sync Live</span>
                        </button>
                      </div>

                      {taskList.map((task, tIdx) => {
                        const isDone = isSubmitted || task.completed;
                        return (
                          <div
                            key={task.id || tIdx}
                            className={`p-1.5 rounded text-xs flex items-start space-x-2 border transition-all ${
                              isDone
                                ? 'bg-white border-emerald-300 text-slate-800'
                                : isUnlocked
                                ? 'bg-white border-slate-200 text-slate-700'
                                : 'bg-slate-100/60 border-slate-200 text-slate-400'
                            }`}
                          >
                            <div className="shrink-0 mt-0.5">
                              {isDone ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              ) : isUnlocked ? (
                                <Circle className="w-3.5 h-3.5 text-slate-400" />
                              ) : (
                                <Lock className="w-3 h-3 text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span
                                  className={`font-semibold line-clamp-1 text-[11px] ${
                                    isDone ? 'text-slate-900' : 'text-slate-700'
                                  }`}
                                >
                                  {task.title}
                                </span>
                                {task.category && (
                                  <span
                                    className={`shrink-0 text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-medium ${
                                      isDone
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-slate-200 text-slate-600'
                                    }`}
                                  >
                                    {task.category}
                                  </span>
                                )}
                              </div>
                              {task.description && (
                                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="pt-3 border-t border-slate-100">
                {isUnlocked ? (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {isSubmitted ? 'Submission Recorded' : 'Autosave Enabled'}
                    </span>
                    <span className="text-xs font-semibold text-blue-900 flex items-center space-x-1">
                      <span>{isSubmitted ? 'Review Work' : 'Open Lab'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center space-x-1.5 text-[11px]">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Scheduled by Lecturer</span>
                    </span>
                    <span className="text-[11px] font-medium">Locked</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Locked Lab Notification Modal */}
      {lockedModalLab && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-4 text-slate-900">
              <div className="p-2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Laboratory Locked</h3>
                <p className="text-xs text-slate-500">Access Restricted by Instructor</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed mb-6 space-y-2">
              <p>
                <strong>
                  Lab {String(lockedModalLab.labNumber).padStart(2, '0')}: {lockedModalLab.title}
                </strong>{' '}
                is currently locked.
              </p>
              <p>
                The course lecturer activates each module according to the semester laboratory schedule.
                Direct URL navigation is blocked by server-side authorization.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setLockedModalLab(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded transition-colors cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
