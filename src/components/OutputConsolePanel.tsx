import React, { useState } from 'react';
import {
  Terminal,
  Image as ImageIcon,
  RotateCcw,
  Trash2,
  BookmarkPlus,
  Check,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import type { ExecutionResult } from '../../lib/runners/types';

interface OutputConsolePanelProps {
  result: ExecutionResult | null;
  isRunning: boolean;
  onClearConsole: () => void;
  onRestartRuntime: () => void;
  onAddOutputToReport: (output: string) => void;
  onAddPlotToReport: (plotBase64: string, caption?: string) => void;
}

export const OutputConsolePanel: React.FC<OutputConsolePanelProps> = ({
  result,
  isRunning,
  onClearConsole,
  onRestartRuntime,
  onAddOutputToReport,
  onAddPlotToReport,
}) => {
  const [activeTab, setActiveTab] = useState<'console' | 'plots'>('console');
  const [copiedOutput, setCopiedOutput] = useState(false);
  const [copiedPlotIdx, setCopiedPlotIdx] = useState<number | null>(null);

  const plots = result?.plots || [];

  const handleAttachOutput = () => {
    if (!result) return;
    const text = result.stdout || result.stderr || 'No output produced';
    onAddOutputToReport(text);
    setCopiedOutput(true);
    setTimeout(() => setCopiedOutput(false), 2000);
  };

  const handleAttachPlot = (b64: string, idx: number) => {
    onAddPlotToReport(b64, `Behavioral Simulation Execution Plot ${idx + 1}`);
    setCopiedPlotIdx(idx);
    setTimeout(() => setCopiedPlotIdx(null), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-200">
      {/* Console Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('console')}
            className={`px-2 py-0.5 text-xs font-semibold rounded transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'console'
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Terminal Console</span>
          </button>
          <button
            onClick={() => setActiveTab('plots')}
            className={`px-2 py-0.5 text-xs font-semibold rounded transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'plots'
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
            <span>Figures ({plots.length})</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          {result && (
            <div className="flex items-center space-x-1 text-[11px] text-slate-400 font-mono">
              <Clock className="w-3 h-3" />
              <span>{result.executionTimeMs} ms</span>
            </div>
          )}

          {activeTab === 'console' && (
            <button
              onClick={handleAttachOutput}
              disabled={!result}
              className="inline-flex items-center space-x-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium cursor-pointer disabled:opacity-40"
              title="Add output text to report"
            >
              {copiedOutput ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Added</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-3 h-3" />
                  <span>Add to Report</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onClearConsole}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer"
            title="Clear Console"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onRestartRuntime}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer"
            title="Restart Python Runtime"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Console Content */}
      {activeTab === 'console' && (
        <div className="flex-1 p-3 font-mono text-xs overflow-y-auto space-y-2 select-text">
          {isRunning && (
            <div className="text-amber-400 flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Pyodide executing Python program...</span>
            </div>
          )}

          {result ? (
            <>
              {result.stdout && (
                <pre className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {result.stdout}
                </pre>
              )}
              {result.stderr && (
                <pre className="text-red-400 whitespace-pre-wrap leading-relaxed mt-2 p-2 bg-red-950/40 border border-red-900/50 rounded">
                  {result.stderr}
                </pre>
              )}
              {result.error && !result.stderr && (
                <div className="text-red-400 flex items-start space-x-1.5 p-2 bg-red-950/40 rounded border border-red-900/50">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <pre className="whitespace-pre-wrap">{result.error}</pre>
                </div>
              )}
            </>
          ) : (
            !isRunning && (
              <div className="text-slate-500 italic py-4">
                Program output will be rendered here. Click <strong>Run Code</strong> in the top
                toolbar to execute via Pyodide.
              </div>
            )
          )}
        </div>
      )}

      {/* Figures Content (Matplotlib Render) */}
      {activeTab === 'plots' && (
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {plots.length > 0 ? (
            plots.map((plotUrl, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg p-3 border border-slate-200 flex flex-col items-center"
              >
                <img
                  src={plotUrl}
                  alt={`Plot figure ${idx + 1}`}
                  className="max-h-64 object-contain rounded"
                />
                <div className="w-full flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-600 font-medium">Figure {idx + 1} (Matplotlib)</span>
                  <button
                    onClick={() => handleAttachPlot(plotUrl, idx)}
                    className="inline-flex items-center space-x-1 text-xs text-blue-900 hover:text-blue-700 font-semibold cursor-pointer"
                  >
                    {copiedPlotIdx === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Attached to Report</span>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span>Add Figure to Report</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              No graphical figures detected in this run. Use Matplotlib (e.g. <code className="bg-slate-900 px-1 py-0.5 rounded text-[11px]">plt.show()</code>) in your Python script to generate diagrams.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
