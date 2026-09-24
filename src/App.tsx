import React, { useState, useEffect } from 'react';
import type { AuthUserPublic } from '../lib/auth/types';
import { apiClient } from './lib/api-client';
import { LabRegistry } from '../labs/registry';
import { getBrowserValue } from './lib/browser-persistence';
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
  >('dashboard');
  const [activeLabId, setActiveLabId] = useState<string | null>(null);
  const [isInstructorPreview, setIsInstructorPreview] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [labs, setLabs] = useState<LabSummary[]>([]);
  const [labsLoading, setLabsLoading] = useState(false);
  const [labsError, setLabsError] = useState<string | null>(null);
  const [showInstructorAccess, setShowInstructorAccess] = useState(false);
  const [instructorUnlockLoading, setInstructorUnlockLoading] = useState(false);
  const [instructorUnlockError, setInstructorUnlockError] = useState<string | null>(null);
  const [instructorData, setInstructorData] = useState<any | null>(null);

  useEffect(() => {
    // Current teaching mode is deliberately open access. Student identity is
    // entered only in the report, not at application entry.
    apiClient.clearToken();
    setUser(DEFAULT_OPEN_USER);
    fetchLabs().finally(() => setLoading(false));
  }, []);

  const fetchLabs = async () => {
    setLabsLoading(true);
    setLabsError(null);

    try {
      const manifests = LabRegistry.getAllLabs();

      const localSubmissionStates = await Promise.all(
        manifests.map(async (manifest) => {
          try {
            return Boolean(
              await getBrowserValue(`aise:${manifest.id}:submission`)
            );
          } catch {
            return false;
          }
        })
      );

      const summaries: LabSummary[] = manifests.map((manifest, index) => {
        const isUnlocked = manifest.labNumber === 1;
        const isSubmitted = localSubmissionStates[index];

        return {
          id: manifest.id,
          labNumber: manifest.labNumber,
          week: manifest.week,
          title: manifest.title,
          shortDescription: manifest.shortDescription,
          estimatedDuration: manifest.estimatedDuration,
          isUnlocked,
          isPublished: true,
          status: isSubmitted
            ? 'Submitted'
            : isUnlocked
            ? 'Available'
            : 'Locked',
          progressPercentage: isSubmitted ? 100 : 0,
          completedTasks: isSubmitted ? manifest.tasks?.length || 0 : 0,
          totalTasks: manifest.tasks?.length || 0,
          tasks: (manifest.tasks || []).map((task) => ({
            ...task,
            completed: isSubmitted,
          })),
          isSubmitted,
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
    if (instructorData) {
      setActiveView('instructor');
      return;
    }

    setInstructorUnlockError(null);
    setShowInstructorAccess(true);
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
        body: JSON.stringify({ code }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload.error || 'Unable to unlock instructor materials.'
        );
      }

      setInstructorData(payload.data);
      setShowInstructorAccess(false);
      setActiveView('instructor');
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
    setActiveView('dashboard');
    fetchLabs();
  };

  const handleSelectLab = (labId: string) => {
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
          setActiveView('dashboard');
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
          />
        )}
        {/* VIEW: LAB WORKSPACE (STUDENT OR PREVIEW) */}
        {activeView === 'lab' && activeLabId && (
          <LabWorkspace
            labId={activeLabId}
            user={user}
            onBack={() => {
              setActiveView('dashboard');
              setActiveLabId(null);
              setIsInstructorPreview(false);
              fetchLabs();
            }}
            isInstructorPreview={isInstructorPreview}
          />
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
          error={instructorUnlockError}
        />
      )}
    </div>
  );
}
