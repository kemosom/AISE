import React, { useRef } from 'react';
import { Eye } from 'lucide-react';
import type { AuthUserPublic } from '../../lib/auth/types';

interface HeaderProps {
  user: AuthUserPublic | null;
  activeView: string;
  onNavigate: (view: string) => void;
  isInstructorPreview?: boolean;
  onExitPreview?: () => void;
  onInstructorAccess?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeView,
  onNavigate,
  isInstructorPreview,
  onExitPreview,
  onInstructorAccess,
}) => {
  const isStudent = !user || user.role?.toUpperCase() === 'STUDENT';
  const instructorClicksRef = useRef<number[]>([]);

  const handleHiddenInstructorClick = () => {
    const now = Date.now();
    const recent = instructorClicksRef.current.filter(
      (timestamp) => now - timestamp < 4000
    );
    recent.push(now);
    instructorClicksRef.current = recent;

    if (recent.length >= 5) {
      instructorClicksRef.current = [];
      onInstructorAccess?.();
    }
  };

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      {isInstructorPreview && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-xs px-5 py-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <Eye className="w-3.5 h-3.5" />
            Instructor preview
          </span>
          {onExitPreview && (
            <button
              type="button"
              onClick={onExitPreview}
              className="font-semibold hover:underline"
            >
              Exit preview
            </button>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3 text-left">
          <button
            type="button"
            onClick={handleHiddenInstructorClick}
            className="w-7 h-7 rounded-md bg-slate-950 text-white flex items-center justify-center text-[10px] font-bold tracking-wide"
            aria-label="AISE"
          >
            AISE
          </button>
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="leading-tight text-left"
          >
            <div className="text-sm font-semibold text-slate-950">AISE Lab Studio</div>
            <div className="text-[10px] text-slate-400">MAI5124 · AI in Software Engineering</div>
          </button>
        </div>

        <nav className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeView === 'dashboard'
                ? 'bg-slate-100 text-slate-950'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Laboratories
          </button>

          {!isStudent && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('students')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeView === 'students'
                    ? 'bg-slate-100 text-slate-950'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Students
              </button>
              <button
                type="button"
                onClick={() => onNavigate('submissions')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeView === 'submissions'
                    ? 'bg-slate-100 text-slate-950'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Submissions
              </button>
            </>
          )}

          {isStudent && (
            <span className="hidden sm:inline-flex ml-2 px-2 py-1 rounded-full border border-slate-200 text-[10px] font-medium text-slate-500">
              Open access
            </span>
          )}
        </nav>
      </div>
    </header>
  );
};
