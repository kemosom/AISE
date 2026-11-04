import React, { useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import {
  Activity, AlertCircle, ArrowRight, BookOpen, CheckCircle2, ChevronDown, Clipboard,
  Code2, Download, FileText, KeyRound, Play, RefreshCw, ShieldCheck, Terminal,
} from 'lucide-react';
import { defaultCodeRunner } from '../../lib/runners/pyodide-runner';
import { Lab04HintQuiz } from './Lab04HintQuiz';
import { Lab04Analysis } from './Lab04Analysis';
import { buildLab04PythonAnalysis } from '../lib/lab04-analysis-python';
import { summarizeLab04 } from '../lib/lab04-statistics';
import casesJson from '../../labs/lab04-software-repair-agents/cases.json';
import exercisesJson from '../../labs/lab04-software-repair-agents/exercises.json';
import type { Lab04Issue } from '../../labs/lab04-software-repair-agents/types';
import {
  buildFeedback, compileAndTest, extractTypeScriptSource, resultsToCsv,
  saveTextFile, type BuildResult, type RepairRun,
} from '../lib/lab04-engine';

type Exercise = {
  id: string; step: string; title: string; explanation: string;
  requirements: string[]; starter: string; solution: string; verification: string;
};
type Props = {
  isInstructorPreview?: boolean;
  onOpenReport: () => void;
  onCopyEvidence?: (text: string) => void;
  onCodeChange?: (source: string) => void;
};
const exercises = exercisesJson as Exercise[];
const cases = casesJson as Lab04Issue[];
const STORAGE_PREFIX = 'aise:lab04:notebook-v3';
const MODEL = 'gemini-3.6-flash';

function mean(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}
function normalizeDecision(output: string): { action: string; prompt?: string } {
  const markers = output.split('\n').filter((line) => line.startsWith('LAB4_DECISION:'));
  const marker = markers[markers.length - 1];
  if (!marker) throw new Error('Python did not return an agent decision. Check the code cell output.');
  const decision = JSON.parse(marker.slice('LAB4_DECISION:'.length));
  if (!['generate', 'finish', 'stop'].includes(decision.action)) throw new Error('Invalid agent action.');
  if (decision.action === 'generate' && (!decision.prompt || decision.prompt.length < 40)) {
    throw new Error('The generate action must include a meaningful prompt.');
  }
  return decision;
}
function describe(result: BuildResult): string[] {
  const output = [result.compilationPassed ? 'TypeScript compilation: PASSED' : 'TypeScript compilation: FAILED'];
  for (const line of result.diagnostics) output.push(line);
  for (const check of result.checks) output.push((check.passed ? 'PASS · ' : 'FAIL · ') + check.name + (check.error ? ': ' + check.error : ''));
  output.push('Build and tests: ' + result.elapsedMs + ' ms');
  return output;
}

export const Lab04Notebook: React.FC<Props> = ({ isInstructorPreview, onOpenReport, onCopyEvidence, onCodeChange }) => {
  const storageKey = STORAGE_PREFIX + (isInstructorPreview ? ':instructor-preview' : ':student');
  const [cells, setCells] = useState<Record<string, string>>(() => {
    const initial = Object.fromEntries(exercises.map((exercise) => [exercise.id, exercise.starter]));
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return { ...initial, ...(stored?.cells || {}) };
    } catch { return initial; }
  });
  const [selectedCase, setSelectedCase] = useState<string>('checkout');
  const [cellOutput, setCellOutput] = useState<Record<string, { text: string; success: boolean }>>({});
  const [apiKey, setApiKey] = useState(''); // Deliberately not persisted.
  const [apiStatus, setApiStatus] = useState('');
  const [apiConnected, setApiConnected] = useState(false);
  const [buildResult, setBuildResult] = useState<BuildResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [runningCell, setRunningCell] = useState<string | null>(null);
  const [activity, setActivity] = useState<string[]>([]);
  const [repetitions, setRepetitions] = useState(1);
  const [batchProgress, setBatchProgress] = useState<{
    completed: number; total: number; issue: string; strategy: string;
  } | null>(null);
  const terminalRef = useRef<HTMLPreElement | null>(null);
  const [analysisPlots, setAnalysisPlots] = useState<string[]>([]);
  const [runs, setRuns] = useState<RepairRun[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return Array.isArray(stored?.runs) ? stored.runs : [];
    } catch { return []; }
  });

  const currentIssue = useMemo(
    () => cases.find((issue) => issue.id === selectedCase) || cases[0],
    [selectedCase]
  );
  useEffect(() => {
    // Only code and experiment records are saved. Never store an API key.
    localStorage.setItem(storageKey, JSON.stringify({ cells, runs }));
  }, [cells, runs]);

  useEffect(() => {
    if (!onCodeChange) return;
    const combined = exercises.map((exercise) =>
      '# ' + exercise.title + '\n' + cells[exercise.id]
    ).join('\n\n');
    onCodeChange(combined);
  }, [cells]);

  const appendLog = (entry: string) => setActivity((previous) => [...previous.slice(-100), entry]);
  useEffect(() => {
    // Make live compiler and model events visible as they arrive.
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [activity]);
  const updateCell = (id: string, code: string) => setCells((previous) => ({ ...previous, [id]: code }));

  const verifyExercise = async (exercise: Exercise) => {
    setRunningCell(exercise.id);
    try {
      const result = await defaultCodeRunner.run(cells[exercise.id] + '\n' + exercise.verification);
      const success = result.exitCode === 0 && result.stdout.includes('PASS:');
      setCellOutput((previous) => ({
        ...previous,
        [exercise.id]: { success, text: (result.stdout + '\n' + result.stderr).trim() || 'No output returned.' },
      }));
      return success;
    } finally { setRunningCell(null); }
  };

  const checkOriginal = async () => {
    setBusy(true);
    setBuildResult(null);
    appendLog('Compiling original source: ' + currentIssue.file);
    try {
      const output = await compileAndTest(currentIssue, currentIssue.source);
      setBuildResult(output);
      appendLog(buildFeedback(output));
    } catch (error) {
      appendLog('Build runner error: ' + (error instanceof Error ? error.message : String(error)));
    } finally { setBusy(false); }
  };

  const callModel = async (prompt: string, onRequest?: () => void, onTokens?: (count: number) => void):
    Promise<{ text: string; tokens: number }> => {
    if (!apiKey.trim()) throw new Error('Enter a Gemini API key in Step 07.');
    // A transient 503, timeout or empty candidate is a provider problem.
    // Retry that request once without counting it as an agent repair attempt.
    for (let request = 0; request < 2; request++) {
      onRequest?.();
      let response: Response;
      try {
        response = await fetch('/api/lab04-model', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: apiKey.trim(), prompt }),
        });
      } catch (error) {
        if (request === 0) {
          appendLog('Gemini connection interrupted. Retrying the model request once...');
          continue;
        }
        throw new Error('Gemini connection failed after two requests.');
      }
      const data = await response.json().catch(() => ({}));
      // Count provider-reported tokens even when reasoning stops before
      // producing visible code; otherwise unsuccessful calls look free.
      const reportedTokens = Number(
        data.usageTokens ?? ((data.inputTokens || 0) + (data.outputTokens || 0) + (data.thoughtTokens || 0))
      );
      if (Number.isFinite(reportedTokens) && reportedTokens > 0) onTokens?.(reportedTokens);
      if (!response.ok || typeof data.text !== 'string' || !data.text.trim()) {
        const reason: string = data.error || 'Gemini returned an empty or invalid response.';
        if (request === 0 && data.retryable === true) {
          appendLog(reason + ' Retrying the model request once...');
          continue;
        }
        throw new Error(reason);
      }
      return { text: data.text, tokens: reportedTokens };
    }
    throw new Error('Gemini did not return usable source code after two model requests.');
  };

  const checkApi = async () => {
    setBusy(true);
    setApiConnected(false);
    setApiStatus('Connecting to Gemini...');
    try {
      const response = await callModel('Reply with the single word READY.');
      setApiStatus('Connection successful. Model: ' + MODEL + '. Response: ' + response.text.slice(0, 60));
      setApiConnected(true);
    } catch (error) {
      setApiStatus(error instanceof Error ? error.message : String(error));
    } finally { setBusy(false); }
  };

  const pythonPolicy = async (
    name: 'reactive_agent' | 'intelligent_agent',
    issue: Lab04Issue,
    source: string,
    feedback: string,
    attempts: number,
    lastPassed: boolean,
    history: Array<{ feedback: string }>,
    maxAttempts: number
  ) => {
    const state = {
      issue: { id: issue.id, file: issue.file, report: issue.report },
      source, feedback, attempts, last_passed: lastPassed, history, max_attempts: maxAttempts,
    };
    // Base64 transports the full issue and compiler feedback into Python
    // without changing backslashes, multiline source or quote characters.
    const encoded = btoa(Array.from(new TextEncoder().encode(JSON.stringify(state)),
      (byte) => String.fromCharCode(byte)).join(''));
    const selectedPolicy = name === 'reactive_agent' ? cells.reactive : cells.intelligent;
    const python = [
      'import base64, json',
      cells.context,
      selectedPolicy,
      '_state = json.loads(base64.b64decode("' + encoded + '").decode("utf-8"))',
      '_issue = _state["issue"]',
      '_repository = {_issue["file"]: _state["source"]}',
      '_state["source"] = select_context(_issue, _repository)',
      '_decision = ' + name + '(_state)',
      'if not isinstance(_decision, dict): raise TypeError("Agent policy must return a dictionary")',
      'print("LAB4_DECISION:" + json.dumps(_decision))',
    ].join('\n\n');
    const output = await defaultCodeRunner.run(python);
    if (output.exitCode !== 0) {
      throw new Error('Python ' + name + ' on ' + issue.id + ':\n' +
        (output.stderr || output.error || 'Unknown Python execution failure'));
    }
    return normalizeDecision(output.stdout);
  };

  const runOne = async (issue: Lab04Issue, strategy: 'reactive' | 'intelligent'): Promise<RepairRun> => {
    const started = performance.now();
    let source = issue.source;
    let attempts = 0;
    let modelCalls = 0;
    let modelTokens = 0;
    let toolMessages = 0;
    let toolBytes = 0;
    let passed = false;
    let status = 'Unresolved';
    let phase: 'baseline' | 'agent' | 'model' | 'compile' = 'baseline';
    const trace: string[] = [];
    const record = (message: string) => { trace.push(message); appendLog('[' + issue.id + ' / ' + strategy + '] ' + message); };
    const history: Array<{ feedback: string }> = [];
    const limit = strategy === 'reactive' ? 1 : 3;
    let feedback = '';
    try {
      record('Compiling the original TypeScript source...');
      const baseline = await compileAndTest(issue, source);
      toolMessages += baseline.messages;
      toolBytes += baseline.bytes;
      feedback = buildFeedback(baseline);
      record(feedback);
      // A clean starting source would invalidate this defect-repair experiment.
      if (baseline.passed) throw new Error('The original case unexpectedly passes. Stop and inspect the repository.');
      for (let index = 0; index < limit + 1; index++) {
        phase = 'agent';
        const decision = await pythonPolicy(
          strategy === 'reactive' ? 'reactive_agent' : 'intelligent_agent',
          issue, source, feedback, attempts, passed, history, limit
        );
        record('Agent decision: ' + decision.action);
        if (decision.action === 'finish') { status = passed ? 'Resolved' : 'Stopped'; break; }
        if (decision.action === 'stop') { status = passed ? 'Resolved' : 'Unresolved'; break; }
        if (attempts >= limit) throw new Error('Agent exceeded the attempt limit.');
        phase = 'model';
        record('Requesting model-generated patch ' + (attempts + 1) + '/' + limit + '...');
        const response = await callModel(
          decision.prompt || '',
          () => { modelCalls++; },
          (count) => { modelTokens += count; }
        );
        let generatedSource: string;
        try {
          generatedSource = extractTypeScriptSource(response.text);
        } catch (error) {
          attempts++;
          feedback = 'Generated patch was not a valid complete TypeScript source: ' +
            (error instanceof Error ? error.message : String(error));
          history.push({ feedback });
          record(feedback);
          continue;
        }
        attempts++;
        source = generatedSource;
        phase = 'compile';
        record('Compiling generated code and executing regression tests...');
        const checked = await compileAndTest(issue, source);
        toolMessages += checked.messages;
        toolBytes += checked.bytes;
        passed = checked.passed;
        feedback = buildFeedback(checked);
        history.push({ feedback });
        record(feedback);
        if (passed) { status = 'Resolved'; break; }
      }
    } catch (error) {
      status = phase === 'model' ? 'API error' : 'Execution error';
      record(status + ': ' + (error instanceof Error ? error.message : String(error)));
    }
    const row: RepairRun = {
      issue: issue.id, strategy, success: passed, attempts, modelCalls, modelTokens,
      toolMessages, toolBytes, elapsedMs: Math.round(performance.now() - started),
      status, trace, finalSource: source,
    };
    setRuns((previous) => [...previous, row]);
    return row;
  };

  const verifyAgents = async (): Promise<boolean> => {
    const required = exercises.filter((item) => item.id !== 'metrics');
    for (const exercise of required) {
      const passed = await verifyExercise(exercise);
      if (!passed) {
        appendLog('Fix the Python cell before running the agents: ' + exercise.title);
        return false;
      }
    }
    // Unit checks alone do not verify that the student's policy works with
    // the real compiler output and source code for every issue.
    appendLog('Checking the integrated Python agents against the three issue files...');
    try {
      for (const issue of cases) {
        const baseline = await compileAndTest(issue, issue.source);
        if (baseline.passed) throw new Error(issue.id + ' has no reproducible defect.');
        const feedback = buildFeedback(baseline);
        for (const strategy of ['reactive', 'intelligent'] as const) {
          const decision = await pythonPolicy(
            strategy === 'reactive' ? 'reactive_agent' : 'intelligent_agent',
            issue, issue.source, feedback, 0, false, [],
            strategy === 'reactive' ? 1 : 3
          );
          if (decision.action !== 'generate') {
            throw new Error(issue.id + ' / ' + strategy +
              ': the first decision must request a patch, not ' + decision.action);
          }
        }
      }
      appendLog('Python policies validated on checkout, queue and security.');
      return true;
    } catch (error) {
      appendLog('Python integration check failed: ' + (error instanceof Error ? error.message : String(error)));
      return false;
    }
  };
  const runSelected = async () => {
    if (busy) return;
    setBusy(true); setActivity([]);
    setBatchProgress({ completed: 0, total: 2, issue: currentIssue.id, strategy: 'reactive' });
    try {
      if (!await verifyAgents()) return;
      if (!apiConnected) { appendLog('Use the API connection check in Step 07 first.'); return; }
      const strategies = ['reactive', 'intelligent'] as const;
      for (let i = 0; i < strategies.length; i++) {
        setBatchProgress({ completed: i, total: 2, issue: currentIssue.id, strategy: strategies[i] });
        await runOne(currentIssue, strategies[i]);
        setBatchProgress({ completed: i + 1, total: 2, issue: currentIssue.id, strategy: strategies[i] });
      }
      appendLog('Both agent attempts recorded for ' + currentIssue.id + '. Check each outcome below.');
    } finally { setBusy(false); }
  };

  const runAll = async () => {
    if (busy) return;
    if (!apiConnected) { setApiStatus('Test the API connection first.'); return; }
    // No confirmation dialog: each click runs exactly the selected number
    // of independent trials for both agents on all three cases.
    setBusy(true); setActivity([]);
    const total = cases.length * 2 * repetitions;
    let completed = 0;
    setBatchProgress({ completed: 0, total, issue: cases[0].id, strategy: 'reactive' });
    try {
      if (!await verifyAgents()) return;
      // A full batch is a new experiment dataset, not a continuation of
      // obsolete or partially completed trials from earlier debugging.
      setRuns([]);
      setAnalysisPlots([]);
      setCellOutput((previous) => {
        const updated = { ...previous };
        delete updated.metrics;
        return updated;
      });
      for (let repetition = 0; repetition < repetitions; repetition++) {
        if (repetitions > 1) appendLog('Repetition ' + (repetition + 1) + ' of ' + repetitions + '.');
        for (const issue of cases) {
          for (const strategy of ['reactive', 'intelligent'] as const) {
            setBatchProgress({ completed, total, issue: issue.id, strategy });
            await runOne(issue, strategy);
            completed++;
            setBatchProgress({ completed, total, issue: issue.id, strategy });
          }
        }
      }
      appendLog('All scheduled agent runs finished. Inspect the measurements and execution traces below.');
    } finally { setBusy(false); }
  };

  const runMetricsCell = async () => {
    if (runningCell) return;
    setRunningCell('metrics');
    setAnalysisPlots([]);
    try {
      // This is the same CSV content exported through the results panel.
      const csvText = resultsToCsv(runs);
      const result = await defaultCodeRunner.run(buildLab04PythonAnalysis(cells.metrics, csvText));
      setCellOutput((previous) => ({
        ...previous,
        metrics: { success: result.exitCode === 0, text: (result.stdout + '\n' + result.stderr).trim() || 'No output.' },
      }));
      setAnalysisPlots(result.exitCode === 0 ? (result.plots || []) : []);
    } catch (error) {
      setCellOutput((previous) => ({
        ...previous,
        metrics: { success: false, text: 'Analysis error: ' + (error instanceof Error ? error.message : String(error)) },
      }));
    } finally { setRunningCell(null); }
  };

  const evidence = () => {
    const summary = summarizeLab04(runs);
    const describeGroup = (name: string, group: { n: number; successes: number; successRate: number | null; meanMs: number | null; meanToolBytes: number | null }) =>
      name + ': ' + group.successes + '/' + group.n + ' resolved' +
      ', success=' + (group.successRate === null ? 'N/A' : group.successRate.toFixed(1) + '%') +
      ', mean time=' + (group.meanMs === null ? 'N/A' : group.meanMs.toFixed(0) + ' ms') +
      ', mean worker bytes=' + (group.meanToolBytes === null ? 'N/A' : group.meanToolBytes.toFixed(0));
    return [
      'Lab 04: Reactive versus intelligent software repair agents',
      'Model: ' + MODEL + '. Same initial TypeScript source and regression checks for both strategies.',
      'Completed trials: ' + summary.validCount + '. API/execution errors excluded: ' + summary.errorCount + '.',
      '',
      'OVERALL COMPARISON',
      describeGroup('Reactive', summary.overall.reactive),
      describeGroup('Intelligent', summary.overall.intelligent),
      '',
      'PER-ISSUE BREAKDOWN',
      ...summary.perIssue.flatMap((entry) => [
        describeGroup(entry.issue + ' / reactive', entry.reactive),
        describeGroup(entry.issue + ' / intelligent', entry.intelligent),
      ]),
      '',
      'RECORDED EXECUTION LOG',
      ...runs.map((r) => r.issue + ' / ' + r.strategy + ': status=' + r.status +
        ', success=' + r.success + ', patches=' + r.attempts + ', elapsed_ms=' + r.elapsedMs +
        ', worker_messages=' + r.toolMessages + ', worker_bytes=' + r.toolBytes +
        ', model_calls=' + r.modelCalls + ', model_tokens=' + r.modelTokens),
      '',
      'Worker JSON bytes exclude Gemini API traffic. Unavailable API runs are not software repair failures.',
    ].join('\n');
  };

  const downloadCsv = () => saveTextFile('Lab04_agent_comparison.csv', resultsToCsv(runs), 'text/csv');
  const downloadTraces = () => saveTextFile('Lab04_execution_traces.json', JSON.stringify(runs, null, 2), 'application/json');

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] text-slate-900">
      <div className="mx-auto max-w-[1100px] px-4 py-7 sm:px-8">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-700">
              <BookOpen className="h-4 w-4" /> MAI5124 · Chapter 5 · Lab 04
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">Building and Evaluating AI Software Repair Agents</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Implement two Python agents, use Gemini to generate real TypeScript patches, compile the code,
              execute regression tests, and compare the observed results.
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium">
            {isInstructorPreview ? 'Instructor preview · Lab 04 released' : 'Interactive notebook'}
          </span>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
          {[
            ['01', 'Inspect', 'Reproduce defects'],
            ['02', 'Implement', 'Program Python agents'],
            ['03', 'Experiment', 'Compile and compare'],
            ['04', 'Report', 'Explain the results'],
          ].map(([number, title, subtitle]) => (
            <div key={number} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-blue-600">{number}</div>
              <div className="mt-1 text-sm font-semibold">{title}</div>
              <div className="mt-0.5 text-xs text-slate-500">{subtitle}</div>
            </div>
          ))}
        </div>

        <section className="mb-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
            <p className="text-xs font-semibold text-blue-700">PART A · THE SOFTWARE MAINTENANCE CASE</p>
            <h3 className="mt-1 text-lg font-semibold">01. Maintain a TypeScript operations service</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This laboratory uses three small, lab-authored TypeScript modules with deliberately introduced defects:
              checkout calculations, incident scheduling and request-header logging. You will implement Python agents
              that ask a coding model for a repair, compile the returned source and execute regression tests.
              The software runs in your browser. The example bugs are teaching fixtures, not copied production incidents.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium">
              <a href="https://github.com/kemosom/AISE/blob/main/labs/lab04-software-repair-agents/cases.json"
                target="_blank" rel="noreferrer" className="text-blue-700 underline">View original laboratory source files</a>
              <a href="https://github.com/kemosom/AISE/blob/main/src/workers/lab04-tests.worker.ts"
                target="_blank" rel="noreferrer" className="text-blue-700 underline">View the regression test source</a>
            </div>
          </div>
          <div className="grid gap-0 lg:grid-cols-[300px_1fr]">
            <div className="border-b border-slate-100 p-4 lg:border-b-0 lg:border-r">
              {cases.map((issue) => (
                <button key={issue.id} type="button" onClick={() => { setSelectedCase(issue.id); setBuildResult(null); }}
                  className={'mb-2 w-full rounded-lg border p-3 text-left transition-colors ' +
                    (currentIssue.id === issue.id ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:bg-slate-50')}>
                  <div className="text-[11px] font-semibold text-blue-800">{issue.title.split(' · ')[0]}</div>
                  <div className="mt-1 text-xs font-medium leading-5">{issue.title.split(' · ')[1]}</div>
                  <div className="mt-2 text-[11px] text-slate-500">{issue.type}</div>
                </button>
              ))}
              <button disabled={busy} type="button" onClick={() => void checkOriginal()}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-50">
                <Play className="h-3.5 w-3.5" /> Compile original and run tests
              </button>
            </div>
            <div className="min-w-0 p-4 sm:p-6">
              <h4 className="text-base font-semibold">{currentIssue.title}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-700">{currentIssue.report}</p>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Code2 className="h-4 w-4" /> {currentIssue.file}
              </div>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-4 text-[12px] leading-6 text-slate-100"><code>{currentIssue.source}</code></pre>
              {currentIssue.sources && (
                <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                  <div className="text-xs font-semibold text-slate-700">Engineering references for this case</div>
                  {currentIssue.sources.map((source) => (
                    <div key={source.url} className="text-xs leading-5">
                      <a href={source.url} target="_blank" rel="noreferrer" className="font-medium text-blue-700 underline">
                        {source.label}
                      </a>
                      <p className="text-slate-500">{source.note}</p>
                    </div>
                  ))}
                </div>
              )}
              {buildResult && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold"><Terminal className="h-4 w-4"/> Compiler and test output</div>
                  <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6">{describe(buildResult).join('\n')}</pre>
                </div>
              )}
              <p className="mt-3 text-xs text-slate-500">
                Observe where the original source fails. A successful TypeScript build does not prove the behaviour is correct.
              </p>
            </div>
          </div>
        </section>

        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold text-blue-700">PART B · IMPLEMENT YOUR AGENTS</p>
          <h3 className="mt-1 text-lg font-semibold">02. Execute the notebook cells in order</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Complete each function where marked. Press <strong>Run cell</strong> to execute real Python assertions in the browser.
            If you need a full-code example, complete the three-question checkpoint next to that cell. You can retry the questions as often as needed. Your code is saved in this browser.
          </p>
        </div>

        {exercises.filter((item) => item.id !== 'metrics').map((exercise) => (
          <section key={exercise.id} className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 p-5 sm:px-7">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-blue-700">Step {exercise.step}</span>
                  <h3 className="mt-1 text-base font-semibold">{exercise.title}</h3>
                </div>
                {cellOutput[exercise.id] && (cellOutput[exercise.id].success
                  ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  : <AlertCircle className="h-5 w-5 text-amber-600" />)}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{exercise.explanation}</p>
              <ul className="mt-3 space-y-1 text-xs leading-5 text-slate-600">
                {exercise.requirements.map((requirement) => <li key={requirement}>• {requirement}</li>)}
              </ul>
            </div>
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-500">
              In [{exercise.step}] · Python 3 · Editable
            </div>
            <div className="px-2 py-3">
              <Editor
                height={Math.max(190, cells[exercise.id].split('\n').length * 20 + 35)}
                language="python"
                theme="vs"
                value={cells[exercise.id]}
                onChange={(value) => updateCell(exercise.id, value || '')}
                options={{ minimap: { enabled: false }, lineNumbers: 'on', fontSize: 13, wordWrap: 'on',
                  scrollBeyondLastLine: false, tabSize: 4, automaticLayout: true }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
              <button type="button" disabled={busy || runningCell !== null} onClick={() => void verifyExercise(exercise)}
                className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
                <Play className="h-3.5 w-3.5" /> {runningCell === exercise.id ? 'Running Python...' : 'Run cell'}
              </button>
              <Lab04HintQuiz exerciseId={exercise.id} source={exercise.solution}
                onInsert={(code) => updateCell(exercise.id, code)} />
            </div>
            {cellOutput[exercise.id] && (
              <pre className={'whitespace-pre-wrap break-words border-t px-5 py-3 font-mono text-xs leading-6 ' +
                (cellOutput[exercise.id].success ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-950')}>
                {cellOutput[exercise.id].text}
              </pre>
            )}
          </section>
        ))}

        <section className="mb-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
          <p className="text-xs font-semibold text-blue-700">PART C · CONNECT A CODING MODEL</p>
          <h3 className="mt-1 text-lg font-semibold">07. Connect Gemini and test the connection</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Enter the classroom Gemini API key supplied by your instructor and select <strong>Test API connection</strong>.
            If instructed to obtain your own key, use <a className="font-semibold text-blue-700 underline"
              href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Google AI Studio</a>.
            The key is used for requests during this session and is not saved with your code or report.
          </p>
          <p className="mt-2 text-xs text-slate-500">Model: {MODEL}. An API request is required to generate each real source-code patch. Do not paste your key into Python cells or your report.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="min-w-[260px] flex-1">
              <span className="mb-1 block text-xs font-semibold text-slate-700">Gemini API key</span>
              <input type="password" value={apiKey} onChange={(event) => { setApiKey(event.target.value); setApiConnected(false); }}
                placeholder="Paste your API key here" autoComplete="off"
                className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-600" />
            </label>
            <button type="button" disabled={busy || !apiKey.trim()} onClick={() => void checkApi()}
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">
              <KeyRound className="h-4 w-4"/> Test API connection
            </button>
          </div>
          {apiStatus && <p className={'mt-3 text-xs leading-5 ' + (apiConnected ? 'text-emerald-700' : 'text-amber-800')}>{apiStatus}</p>}
        </section>

        <section className="mb-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
          <p className="text-xs font-semibold text-blue-700">PART D · COMPILE, REPAIR AND EVALUATE</p>
          <h3 className="mt-1 text-lg font-semibold">08. Compare the two agent strategies</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Run the reactive and intelligent agents against the selected defect. The original source is reset for each
            run. Watch each model patch being compiled and tested. The reactive agent gets one attempt; the intelligent
            agent can use compiler and test feedback for up to three attempts.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button disabled={busy || !apiConnected} onClick={() => void runSelected()} type="button"
              className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">
              <Play className="h-4 w-4"/> Run both agents on {currentIssue.id}
            </button>
            <button disabled={busy || !apiConnected} onClick={() => void runAll()} type="button"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold disabled:opacity-50">
              <RefreshCw className="h-4 w-4"/> Run all three cases
            </button>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              Repetitions per issue
              <select value={repetitions} onChange={(event) => setRepetitions(Number(event.target.value))}
                disabled={busy} aria-label="Repetitions per issue"
                className="rounded-md border border-slate-300 bg-white px-2 py-2 text-xs font-medium text-slate-800">
                {[1, 2, 3].map((count) => <option key={count} value={count}>{count}</option>)}
              </select>
            </label>
            {busy && <span className="text-xs font-medium text-blue-700"><Activity className="mr-1 inline h-3 w-3 animate-pulse"/> Running compiler and agents...</span>}
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            One repetition runs six independent agent trials. Repetitions add observations and use more model requests.
            Run all starts a fresh experiment dataset; export earlier results first if needed.
            A technical error is recorded and does not stop the remaining cases.
          </p>
          {batchProgress && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3" role="status">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-800">
                  {busy ? 'Running' : 'Last run'}: {batchProgress.issue} / {batchProgress.strategy}
                </span>
                <span className="text-slate-600">{batchProgress.completed} of {batchProgress.total} trials recorded</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-blue-600 transition-all duration-200"
                  style={{ width: (100 * batchProgress.completed / batchProgress.total) + '%' }} />
              </div>
            </div>
          )}
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
            <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2 text-xs font-medium text-slate-300">
              <Terminal className="h-4 w-4" /> Agent and compiler execution log
            </div>
            <pre ref={terminalRef} aria-live="polite" className="max-h-96 min-h-40 overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-xs leading-6 text-emerald-200">
              {activity.length ? activity.join('\n\n') : 'Run an experiment to view model actions, compiler diagnostics and regression-test results.'}
            </pre>
          </div>
        </section>

        <Lab04Analysis
          rows={runs}
          busy={busy}
          onClear={() => {
            if (!window.confirm('Clear all saved Lab 4 experiment measurements? Your code cells will be kept.')) return;
            setRuns([]);
            setAnalysisPlots([]);
            setActivity([]);
            setCellOutput((previous) => {
              const updated = { ...previous };
              delete updated.metrics;
              return updated;
            });
          }}
          onCsv={() => downloadCsv()}
          onTraces={() => downloadTraces()}
        />

        {exercises.filter((item) => item.id === 'metrics').map((exercise) => (
          <section key={exercise.id} className="mb-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="p-5 sm:px-7">
              <span className="text-xs font-semibold text-blue-700">Step {exercise.step} · Python data analysis</span>
              <h3 className="mt-1 text-base font-semibold">{exercise.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{exercise.explanation} This cell uses the same CSV as the export button and produces summary tables and five plots from recorded trials.</p>
            </div>
            <div className="border-y border-slate-100 bg-slate-50 px-5 py-2 text-xs text-slate-500">In [09] · Python 3</div>
            <Editor height={Math.max(220, cells.metrics.split('\n').length * 19 + 40)} language="python" value={cells.metrics} onChange={(v) => updateCell('metrics', v || '')}
              options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, automaticLayout: true }}/>
            <div className="flex flex-wrap justify-between gap-2 border-t border-slate-100 p-4">
              <button disabled={busy || runningCell !== null} onClick={() => void runMetricsCell()}
                className="rounded-md bg-emerald-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
                {runningCell === 'metrics' ? 'Analysing CSV...' : 'Run analysis and generate figures'}
              </button>
              <Lab04HintQuiz exerciseId="metrics" source={exercise.solution}
                onInsert={(code) => updateCell('metrics', code)} />
            </div>
            {cellOutput.metrics && (
              <div className="border-t border-slate-200 p-5">
                <div className="mb-2 text-xs font-semibold text-slate-700">Results calculated from the exported CSV</div>
                <pre className={'overflow-x-auto whitespace-pre rounded-lg p-4 font-mono text-xs leading-6 ' +
                  (cellOutput.metrics.success ? 'bg-slate-950 text-emerald-100' : 'bg-amber-50 text-amber-900')}>
                  {cellOutput.metrics.text}
                </pre>
              </div>
            )}
            {analysisPlots.length > 0 && (
              <div className="grid gap-4 border-t border-slate-200 bg-slate-50 p-5 sm:grid-cols-2">
                {analysisPlots.map((src, index) => (
                  <div key={index} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="mb-2 text-xs font-semibold text-slate-600">Figure {index + 1}</div>
                    <img src={src} alt={'Measured Lab 4 experiment figure ' + (index + 1)} className="w-full" />
                    <a href={src} download={'Lab04_figure_' + (index + 1) + '.png'}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
                      <Download className="h-3 w-3"/> Save figure
                    </a>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}

        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
          <p className="text-xs font-semibold text-blue-700">PART F · LABORATORY REPORT</p>
          <h3 className="mt-1 text-lg font-semibold">10. Submit your technical findings</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use the Report tab to explain the software defects, the two decision strategies and your measured outcomes.
            Include a failed repair or unsuccessful run, with its compiler or test feedback. Discuss why additional repair
            attempts can improve success while increasing execution time and communication.
          </p>
          <ol className="mt-3 space-y-1 text-xs leading-6 text-slate-600">
            <li>1. Include your Python function implementations and verification results.</li>
            <li>2. Compare success rates and mean runtime using your observed experiment table.</li>
            <li>3. Include the recorded tool messages, exchanged bytes and model token counts.</li>
            <li>4. Explain one failure and one limitation of the comparison.</li>
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => { if (onCopyEvidence) onCopyEvidence(evidence()); else navigator.clipboard.writeText(evidence()); }}
              disabled={!runs.length} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-xs font-semibold disabled:opacity-50">
              <Clipboard className="h-4 w-4"/> Copy results to report
            </button>
            <button onClick={onOpenReport} className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
              <FileText className="h-4 w-4"/> Open report <ArrowRight className="h-3.5 w-3.5"/>
            </button>
          </div>
          {isInstructorPreview && <p className="mt-3 flex items-center gap-1 text-xs text-slate-500"><ShieldCheck className="h-3.5 w-3.5"/> Preview reports are not submitted to student records.</p>}
        </section>
      </div>
    </div>
  );
};
