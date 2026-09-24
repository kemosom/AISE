import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  PlayCircle,
  BookmarkPlus,
  Check,
  RotateCcw,
} from 'lucide-react';
import type { LabTestCase } from '../../labs/types';
import type { CodeRunner } from '../../lib/runners/types';

interface TestRunnerPanelProps {
  tests: LabTestCase[];
  runner: CodeRunner;
  userCode: string;
  files: Array<{ name: string; content: string }>;
  onAddTestResultsToReport: (summary: string) => void;
  onTestRunComplete?: (passedCount: number, totalCount: number) => void;
}

export const TestRunnerPanel: React.FC<TestRunnerPanelProps> = ({
  tests,
  runner,
  userCode,
  files,
  onAddTestResultsToReport,
  onTestRunComplete,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<
    Array<{ id: string; name: string; passed: boolean; message: string }>
  >([]);
  const [copied, setCopied] = useState(false);

  const handleRunTests = async () => {
    setIsRunning(true);
    const testResults: Array<{ id: string; name: string; passed: boolean; message: string }> = [];

    for (const testCase of tests) {
      try {
        const fullExecutionCode = `${userCode}\n\n# --- Test Execution Harness ---\n${testCase.testCode}`;
        const execRes = await runner.run(fullExecutionCode, files);

        const passed = execRes.exitCode === 0 && !execRes.error;
        testResults.push({
          id: testCase.id,
          name: testCase.name,
          passed,
          message: passed
            ? 'Requirement verified.'
            : execRes.error || execRes.stderr || 'Assertion failure during test execution.',
        });
      } catch (err: any) {
        testResults.push({
          id: testCase.id,
          name: testCase.name,
          passed: false,
          message: err.message || 'Fatal test error',
        });
      }
    }

    setResults(testResults);
    setIsRunning(false);

    const passedCount = testResults.filter((r) => r.passed).length;
    if (onTestRunComplete) {
      onTestRunComplete(passedCount, testResults.length);
    }
  };

  const handleAttachResults = () => {
    const passed = results.filter((r) => r.passed).length;
    const text = `Requirement Verification: ${passed}/${results.length} tests passed.\n${results
      .map((r) => `[${r.passed ? 'PASS' : 'FAIL'}] ${r.name}: ${r.message}`)
      .join('\n')}`;

    onAddTestResultsToReport(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const passedTotal = results.filter((r) => r.passed).length;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Requirement Verification
          </h3>
          <p className="text-[11px] text-slate-500">
            Run executable checks against the stated laboratory requirements.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {results.length > 0 && (
            <button
              onClick={handleAttachResults}
              className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs text-blue-900 hover:bg-blue-50 border border-blue-200 rounded font-medium cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Attached</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>Add to Report</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleRunTests}
            disabled={isRunning}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>{isRunning ? 'Verifying...' : 'Verify Requirements'}</span>
          </button>
        </div>
      </div>

      {/* Summary Score */}
      {results.length > 0 && (
        <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
          <div className="text-xs font-medium text-slate-700">Verification result:</div>
          <div className="flex items-center space-x-2">
            <span
              className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                passedTotal === results.length
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {passedTotal} of {results.length} Requirements Verified
            </span>
          </div>
        </div>
      )}

      {/* Test List */}
      <div className="divide-y divide-slate-100">
        {tests.map((test) => {
          const res = results.find((r) => r.id === test.id);
          return (
            <div key={test.id} className="py-2.5 flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-800 flex items-center space-x-1.5">
                  {res ? (
                    res.passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    )
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300" />
                  )}
                  <span>{test.name}</span>
                </div>
                <p className="text-[11px] text-slate-500 ml-5 mt-0.5">{test.description}</p>
                {res && !res.passed && (
                  <p className="text-[11px] text-red-600 font-mono ml-5 mt-1 bg-red-50 p-1.5 rounded border border-red-200">
                    {res.message}
                  </p>
                )}
              </div>

              <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-4">
                Weight: {test.weight}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
