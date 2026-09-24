import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import type { AuthUserPublic } from '../../lib/auth/types';
import { apiClient } from '../lib/api-client';

interface LoginViewProps {
  onLoginSuccess: (user: AuthUserPublic) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiClient.post('/api/auth/login', { email, password });
      if (data.token) {
        apiClient.setToken(data.token);
      }
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Invalid institutional credentials');
    } finally {
      setLoading(false);
    }
  };

  const setDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col justify-center items-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg p-8 shadow-xs">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded bg-blue-950 text-white font-bold text-lg mb-3">
            AISE
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">AISE Lab Studio</h1>
          <p className="text-xs font-semibold text-blue-900 mt-1 uppercase tracking-wider">
            MAI5124 AI in Software Engineering
          </p>
          <p className="text-xs text-slate-500 mt-1">Interactive University Laboratory Environment</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Institutional Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@imail.sunway.edu.my"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-900 focus:border-blue-900 outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Student ID"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-900 focus:border-blue-900 outline-none transition-colors"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Initial password for students is your Student ID.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-950 hover:bg-blue-900 text-white font-medium text-sm rounded transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Policy Reminder */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex items-start space-x-2.5 text-slate-500 text-[11px] leading-relaxed">
          <ShieldCheck className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
          <span>
            Institutional access only. Student accounts are provisioned directly by the course lecturer or administrator.
          </span>
        </div>

        {/* Quick Sign-In Credentials (Demo) */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="text-[11px] font-semibold text-slate-600 mb-2 uppercase tracking-wider">
            Quick Sign-In Credentials (Demo)
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => setDemo('student1@imail.sunway.edu.my', '24012345')}
              className="p-2 border border-slate-200 rounded text-left hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="font-medium text-slate-800">Student 1 (Ahmed Ali)</div>
              <div className="text-slate-500 font-mono text-[10px]">ID: 24012345</div>
            </button>
            <button
              type="button"
              onClick={() => setDemo('student3@imail.sunway.edu.my', '24012347')}
              className="p-2 border border-slate-200 rounded text-left hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="font-medium text-slate-800">Student 3 (David Chen)</div>
              <div className="text-slate-500 font-mono text-[10px]">ID: 24012347</div>
            </button>
            <button
              type="button"
              onClick={() => setDemo('lecturer@sunway.edu.my', 'lecturer12345')}
              className="p-2 border border-slate-200 rounded text-left hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="font-medium text-slate-800">Lecturer (Dr. Aaron)</div>
              <div className="text-slate-500 text-[10px]">Course Manager</div>
            </button>
            <button
              type="button"
              onClick={() => setDemo('admin@sunway.edu.my', 'admin12345')}
              className="p-2 border border-slate-200 rounded text-left hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="font-medium text-slate-800">System Admin</div>
              <div className="text-slate-500 text-[10px]">Full Access</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
