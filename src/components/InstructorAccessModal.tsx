import React, { useState } from 'react';
import { KeyRound, X } from 'lucide-react';

interface InstructorAccessModalProps {
  onClose: () => void;
  onUnlock: (code: string) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

export const InstructorAccessModal: React.FC<InstructorAccessModalProps> = ({
  onClose,
  onUnlock,
  isLoading,
  error,
}) => {
  const [code, setCode] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim() || isLoading) return;
    await onUnlock(code);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-slate-950 text-white flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-950">Instructor access</h2>
              <p className="text-[11px] text-slate-500">Protected teaching material</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <label className="block text-xs font-medium text-slate-700 mb-2">
            Instructor code
          </label>
          <input
            type="password"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            autoFocus
            autoComplete="off"
            className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-700"
            placeholder="Enter code"
          />

          {error && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!code.trim() || isLoading}
            className="mt-4 w-full rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {isLoading ? 'Checking…' : 'Open Instructor Admin'}
          </button>

          <p className="mt-3 text-[10px] leading-4 text-slate-400">
            The code is validated on the server and is not embedded in the student application.
          </p>
        </form>
      </div>
    </div>
  );
};
