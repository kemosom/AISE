import React, { useState, useEffect } from 'react';
import type { AuthUserPublic } from '../lib/auth/types';
import { apiClient } from './lib/api-client';
import { LabRegistry } from '../labs/registry';
import { Header } from './components/Header';
import { StudentDashboard, type LabSummary } from './components/StudentDashboard';
import { LecturerDashboard } from './components/LecturerDashboard';
import { LecturerSubmissionsView } from './components/LecturerSubmissionsView';
import { LecturerSubmissionInspector } from './components/LecturerSubmissionInspector';
import { LabWorkspace } from './components/LabWorkspace';
import { InstructorAccessModal } from './components/InstructorAccessModal';
import { InstructorAdminPanel } from './components/InstructorAdminPanel';

const DEFAULT_OPEN_USER: AuthUserPublic = {
  id: 'open-student',
  email: 'student@mai5124.academic',
  name: '',
  studentId: '',
  role: 'STUDENT',
};

export default function App() {
  const [user, setUser] = useState<AuthUserPublic>(DEFAULT_OPEN_USER);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<
    'dashboard' | 'lab' | 'students' | 'submissions' | 'inspect' | 'instructor'
  >(() => {
    if (typeof window === 'undefined') return 'dashboard';
    const saved = window.sessionStorage.getItem('aise:active-view');
    return saved === 'lab' ? 'lab' : 'dashboard';
  });
  const [activeLabId, setActiveLabId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage.getItem('aise:active-lab');
  });
  const [isInstructorPreview, setIsInstructorPreview] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [labs, setLabs] = useState<LabSummary[]>([]);
  const [labsLoading, setLabsLoading] = useState(false);
  const [labsError, setLabsError] = useState<string | null>(null);
  const [showInstructorAccess, setShowInstructorAccess] = useState(false);
  const [instructorUnlockLoading, setInstructorUnlockLoading] = useState(false);
  const [instructorUnlockError, setInstructorUnlockError] = useState<string | null>(null);
  const [instructorData, setInstructorData] = useState<any | null>(null);
  const [instructorSelectedLabId, setInstructorSelectedLabId] = useState(
    'lab01-behavioral-programming'
  );

  useEffect(() => {
    // Current teaching mode is deliberately open access. Student identity is
    // entered only in the report, not at application entry.
    apiClient.clearToken();
    setUser(DEFAULT_OPEN_USER);
    fetchLabs().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (activeView === 'lab' && activeLabId) {
      window.sessionStorage.setItem('aise:active-view', 'lab');
      window.sessionStorage.setItem('aise:active-lab', activeLabId);
      return;
    }

    if (activeView === 'dashboard') {
      window.sessionStorage.removeItem('aise:active-view');
      window.sessionStorage.removeItem('aise:active-lab');
    }
  }, [activeView, activeLabId]);

  const fetchLabs = async () => {
    setLabsLoading(true);
    setLabsError(null);

    try {
      const manifests = LabRegistry.getAllLabs();

      const summaries: LabSummary[] = manifests.map((manifest) => {
        // Only Lab 01 is released. Lab 02 remains visible but locked during revision.
        const isUnlocked = manifest.labNumber === 1;

        return {
          id: manifest.id,
          labNumber: manifest.labNumber,
          week: manifest.week,
          title: manifest.title,
          shortDescription: manifest.shortDescription,
          estimatedDuration: manifest.estimatedDuration,
          isUnlocked,
          isPublished: true,
          status: isUnlocked ? 'Available' : 'Locked',
          progressPercentage: 0,
          completedTasks: 0,
          totalTasks: manifest.tasks?.length || 0,
          tasks: (manifest.tasks || []).map((task) => ({
            ...task,
            completed: false,
          })),
          isSubmitted: false,
          submittedAt: null,
          examMode: manifest.labNumber === 12,
        };
      });

      setLabs(summaries);
    } catch (err: any) {
      console.error('Failed to load bundled labs:', err);
      setLabsError(err.message || 'Unable to load laboratory modules.');
    } finally {
      setLabsLoading(false);
    }
  };

  const handleInstructorTrigger = () => {
    const requestedLabId = instructorData?.labId || activeLabId || 'lab01-behavioral-programming';

    if (instructorData?.labId === requestedLabId) {
      setActiveView('instructor');
      return;
    }

    setInstructorSelectedLabId(requestedLabId);
    setInstructorUnlockError(null);
    setShowInstructorAccess(true);
  };

  const handleSwitchInstructorLab = () => {
    setInstructorSelectedLabId(instructorData?.labId || 'lab01-behavioral-programming');
    setInstructorUnlockError(null);
    setShowInstructorAccess(true);
  };

  const handleReviewInstructorLab = () => {
    if (!instructorData?.labId) return;
    setActiveLabId(instructorData.labId);
    setIsInstructorPreview(true);
    setActiveView('lab');
  };

  const handleInstructorUnlock = async (code: string) => {
    setInstructorUnlockLoading(true);
    setInstructorUnlockError(null);

    try {
      const response = await fetch('/api/instructor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          labId: instructorSelectedLabId,
        }),
      });

      const responseText = await response.text();
      let payload: any = {};

      try {
        payload = responseText ? JSON.parse(responseText) : {};
      } catch {
        payload = {};
      }

      if (!response.ok) {
        throw new Error(
          payload.error ||
            `Instructor access request failed (HTTP ${response.status}).`
        );
      }

      setInstructorData(payload.data);
      setActiveLabId(instructorSelectedLabId);
      // Lab 02 opens its actual student workspace immediately after instructor
      // authentication. Preserve Lab 01's established answer-guide landing.
      // The Lab 02 student access lock remains in force.
      const openLab02 = instructorSelectedLabId === 'lab02-requirement-prioritization';
      setIsInstructorPreview(openLab02);
      setShowInstructorAccess(false);
      setActiveView(openLab02 ? 'lab' : 'instructor');
    } catch (err: any) {
      setInstructorUnlockError(
        err.message || 'Unable to unlock instructor materials.'
      );
    } finally {
      setInstructorUnlockLoading(false);
    }
  };

  const handleExitInstructor = () => {
    setInstructorData(null);
    setInstructorUnlockError(null);
    setShowInstructorAccess(false);
    setIsInstructorPreview(false);
    setActiveLabId(null);
    setActiveView('dashboard');
    fetchLabs();
  };

  const handleSelectLab = (labId: string) => {
    // Also enforce the lock in navigation, not just on the dashboard card.
    if (!labs.some((lab) => lab.id === labId && lab.isUnlocked)) return;
    setActiveLabId(labId);
    setIsInstructorPreview(false);
    setActiveView('lab');
  };

  const handlePreviewLabAsInstructor = (labId: string) => {
    setActiveLabId(labId);
    setIsInstructorPreview(true);
    setActiveView('lab');
  };

  const handleViewSubmissions = (labId: string) => {
    setActiveLabId(labId);
    setActiveView('submissions');
  };

  const handleInspectSubmission = (submission: any) => {
    setSelectedSubmission(submission);
    setActiveView('inspect');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-mono text-xs text-slate-500">
        Loading Laboratory Modules...
      </div>
    );
  }

  const isStudent = user.role?.toLowerCase() === 'student';
  // Guard restored browser sessions that may still point at a now-locked lab.
  const canOpenActiveLab = isInstructorPreview || labs.some(
    (lab) => lab.id === activeLabId && lab.isUnlocked
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Institutional Top Header */}
      <Header
        user={user}
        activeView={activeView}
        onNavigate={(view) => {
          setActiveView(view as any);
          if (view === 'dashboard') {
            setActiveLabId(null);
            setIsInstructorPreview(false);
            fetchLabs();
          }
        }}
        isInstructorPreview={isInstructorPreview}
        onExitPreview={() => {
          setIsInstructorPreview(false);
          setActiveView(instructorData ? 'instructor' : 'dashboard');
          fetchLabs();
        }}
        onInstructorAccess={handleInstructorTrigger}
      />

      {/* Main Routed Content */}
      <main className="flex-1 flex flex-col">
        {activeView === 'instructor' && instructorData && (
          <InstructorAdminPanel
            data={instructorData}
            onExit={handleExitInstructor}
            onSwitchLab={handleSwitchInstructorLab}
            onPreviewLab={handleReviewInstructorLab}
          />
        )}
        {/* VIEW: LAB WORKSPACE (STUDENT OR PREVIEW) */}
        {activeView === 'lab' && activeLabId && canOpenActiveLab && (
          <LabWorkspace
            labId={activeLabId}
            user={user}
            onBack={() => {
              setActiveView(isInstructorPreview && instructorData ? 'instructor' : 'dashboard');
              if (!isInstructorPreview) setActiveLabId(null);
              setIsInstructorPreview(false);
              fetchLabs();
            }}
            isInstructorPreview={isInstructorPreview}
          />
        )}

        {activeView === 'lab' && activeLabId && !canOpenActiveLab && (
          <section className="mx-auto w-full max-w-xl p-8 text-center">
            <h2 className="text-xl font-semibold text-slate-800">Lab temporarily locked</h2>
            <p className="mt-2 text-sm text-slate-600">
              This laboratory is being revised and is not yet available to students.
            </p>
            <button
              type="button"
              className="mt-5 rounded bg-slate-900 px-4 py-2 text-sm text-white"
              onClick={() => {
                setActiveLabId(null);
                setActiveView('dashboard');
                setIsInstructorPreview(false);
              }}
            >
              Return to laboratories
            </button>
          </section>
        )}

        {/* VIEW: LECTURER SUBMISSIONS LIST */}
        {activeView === 'submissions' && activeLabId && (
          <LecturerSubmissionsView
            labId={activeLabId}
            user={user}
            onBack={() => {
              setActiveView('dashboard');
              setActiveLabId(null);
              fetchLabs();
            }}
            onInspectSubmission={handleInspectSubmission}
          />
        )}

        {/* VIEW: LECTURER SUBMISSION INSPECTION */}
        {activeView === 'inspect' && selectedSubmission && (
          <LecturerSubmissionInspector
            submission={selectedSubmission}
            onBack={() => {
              setActiveView('submissions');
              setSelectedSubmission(null);
            }}
          />
        )}

        {/* VIEW: DASHBOARD (STUDENT VS LECTURER) */}
        {activeView === 'dashboard' && (
          isStudent ? (
            <StudentDashboard
              user={user}
              labs={labs}
              isLoading={labsLoading}
              error={labsError}
              onSelectLab={handleSelectLab}
              onRefresh={fetchLabs}
            />
          ) : (
            <LecturerDashboard
              user={user}
              onPreviewLab={handlePreviewLabAsInstructor}
              onViewSubmissions={handleViewSubmissions}
            />
          )
        )}

        {/* VIEW: STUDENTS ROSTER (FOR LECTURER DIRECT NAV) */}
        {activeView === 'students' && (
          <LecturerDashboard
            user={user}
            onPreviewLab={handlePreviewLabAsInstructor}
            onViewSubmissions={handleViewSubmissions}
          />
        )}
      </main>

      {showInstructorAccess && (
        <InstructorAccessModal
          onClose={() => {
            setShowInstructorAccess(false);
            setInstructorUnlockError(null);
          }}
          onUnlock={handleInstructorUnlock}
          isLoading={instructorUnlockLoading}
          selectedLabId={instructorSelectedLabId}
          onSelectLab={setInstructorSelectedLabId}
          error={instructorUnlockError}
        />
      )}
    </div>
  );
}
