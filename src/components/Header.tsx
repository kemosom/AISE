import React from 'react';
import { LogOut, User, Shield, GraduationCap, ArrowLeft, Eye } from 'lucide-react';
import type { AuthUserPublic } from '../../lib/auth/types';
import { isSupabaseConfigured } from '../../lib/supabase/client';

interface HeaderProps {
  user: AuthUserPublic | null;
  activeView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  isInstructorPreview?: boolean;
  onExitPreview?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeView,
  onNavigate,
  onLogout,
  isInstructorPreview,
  onExitPreview,
}) => {
  const isCloud = isSupabaseConfigured();

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      {isInstructorPreview && (
        <div className="bg-amber-500 text-white text-xs px-4 py-1.5 font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="w-3.5 h-3.5" />
            <span>Instructor Preview Mode — Experiencing laboratory as a student</span>
          </div>
          {onExitPreview && (
            <button
              onClick={onExitPreview}
              className="underline hover:text-amber-100 cursor-pointer font-semibold"
            >
              Exit Preview
            </button>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-6">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center space-x-3 text-left group cursor-pointer focus:outline-none"
          >
            <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white font-bold text-sm tracking-wider">
              AISE
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-900 text-sm tracking-tight group-hover:text-blue-900 transition-colors">
                  AISE Lab Studio
                </span>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  MAI5124
                </span>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                    isCloud
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {isCloud ? 'Supabase' : 'Development Mode'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">AI in Software Engineering</p>
            </div>
          </button>

          {/* Navigation Links */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-200">
              {user.role?.toUpperCase() === 'STUDENT' ? (
                <>
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      activeView === 'dashboard'
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Laboratories
                  </button>
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      activeView === 'submissions'
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    My Submissions
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      activeView === 'dashboard'
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Lab Management
                  </button>
                  <button
                    onClick={() => onNavigate('students')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      activeView === 'students'
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Student Roster
                  </button>
                  <button
                    onClick={() => onNavigate('submissions')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      activeView === 'submissions'
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Submissions & Reports
                  </button>
                </>
              )}
            </nav>
          )}
        </div>

        {/* Open Academic Access Indicator */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-800">Open Access</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 font-mono text-[11px]">Session 2026/2027</span>
          </div>
        </div>
      </div>
    </header>
  );
};
