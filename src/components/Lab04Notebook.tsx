import React, { useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import {
  Activity, AlertCircle, ArrowRight, BookOpen, CheckCircle2, ChevronDown, Clipboard,
  Code2, Download, FileText, KeyRound, Play, RefreshCw, ShieldCheck, Terminal,
} from 'lucide-react';
import { defaultCodeRunner } from '../../lib/runners/pyodide-runner';
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
};
const exercises = exercisesJson as Exercise[];
const cases = casesJson as Lab04Issue[];
const STORAGE_KEY = 'aise:lab04:notebook-v1';
const MODEL = 'gemini-3.6-flash';

function mean(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}
function normalizeDecision(output: string): { action: string; prompt?: string } {
  const marker = output.split('\n').find((line) => line.startsWith('LAB4_DECISION:'));
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

export const Lab04Notebook: React.FC<Props> = ({ isInstructorPreview, onOpenReport, onCopyEvidence }) => {
  const [cells, setCells] = useState<Record<string, string>>(() => {
    const initial = Object.fromEntries(exercises.map((exercise) => [exercise.id, exercise.starter]));
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
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
  const [runs, setRuns] = useState<RepairRun[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return Array.isArray(stored?.runs) ? stored.runs : [];
    } catch { return []; }
  });

  const currentIssue = useMemo(
    () => cases.find((issue) => issue.id === selectedCase) || cases[0],
    [selectedCase]
  );
  useEffect(() => {
    // Only code and experiment records are saved. Never store an API key.
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ cells, runs }));
  }, [cells, runs]);

  const appendLog = (entry: string) => setActivity((previous) => [...previous.slice(-60), entry]);
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

  const callModel = async (prompt: string): Promise<{ text: string; tokens: number }> => {
    if (!apiKey.trim()) throw new Error('Enter a Gemini API key in Step 07.');
    const response = await fetch('/api/lab04-model', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: apiKey.trim(), prompt }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Model request failed.');
    return { text: data.text, tokens: (data.inputTokens || 0) + (data.outputTokens || 0) };
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
    const python = [
      cells.context, cells.reactive, cells.intelligent,
      'import json',
      '_issue = json.loads(' + JSON.stringify(JSON.stringify(state.issue)) + ')',
      '_repository = json.loads(' + JSON.stringify(JSON.stringify({ [issue.file]: source })) + ')',
      '_context = select_context(_issue, _repository)',
      '_state = json.loads(' + JSON.stringify(JSON.stringify(state)) + ')',
      '_state["source"] = _context',
      '_decision = ' + name + '(_state)',
      'print("LAB4_DECISION:" + json.dumps(_decision))',
    ].join('\n\n');
    const output = await defaultCodeRunner.run(python);
    if (output.exitCode !== 0) throw new Error('Python agent error:\n' + (output.stderr || output.error || 'Unknown error'));
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
    let status = 'Stopped without a valid patch';
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
        const decision = await pythonPolicy(
          strategy === 'reactive' ? 'reactive_agent' : 'intelligent_agent',
          issue, source, feedback, attempts, passed, history, limit
        );
        record('Agent decision: ' + decision.action);
        if (decision.action === 'finish') { status = passed ? 'Resolved' : 'Stopped'; break; }
        if (decision.action === 'stop') { status = passed ? 'Resolved' : 'Unresolved'; break; }
        if (attempts >= limit) throw new Error('Agent exceeded the attempt limit.');
        modelCalls++;
        record('Requesting model-generated patch ' + (attempts + 1) + '/' + limit + '...');
        const response = await callModel(decision.prompt || '');
        modelTokens += response.tokens;
        source = extractTypeScriptSource(response.text);
        attempts++;
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
      status = 'Error: ' + (error instanceof Error ? error.message : String(error));
      record(status);
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
        appendLog('Complete the failed Python cell: ' + exercise.title);
        return false;
      }
    }
    return true;
  };
  const runSelected = async () => {
    if (busy) return;
    setBusy(true); setActivity([]);
    try {
      if (!await verifyAgents()) return;
      if (!apiConnected) { appendLog('Use the API connection check in Step 07 first.'); return; }
      await runOne(currentIssue, 'reactive');
      await runOne(currentIssue, 'intelligent');
      appendLog('Completed both agent strategies for ' + currentIssue.id + '.');
    } finally { setBusy(false); }
  };
  const runAll = async () => {
    if (busy) return;
    if (!apiConnected) { setApiStatus('Test the API connection first.'); return; }
    if (!window.confirm('Run both agents on all three issues? This can make up to 12 Gemini API requests and consume your API quota.')) return;
    setBusy(true); setActivity([]);
    try {
      if (!await verifyAgents()) return;
      for (const issue of cases) {
        await runOne(issue, 'reactive');
        await runOne(issue, 'intelligent');
      }
      appendLog('All six experiments completed. Review failures and the comparison table.');
    } finally { setBusy(false); }
  };

  const runMetricsCell = async () => {
    setRunningCell('metrics');
    try {
      const rows = runs.map((r) => ({
        strategy: r.strategy, success: r.success, elapsed_ms: r.elapsedMs,
        tool_bytes: r.toolBytes, model_calls: r.modelCalls,
      }));
      const code = cells.metrics + '\nimport json\n_rows = json.loads(' +
        JSON.stringify(JSON.stringify(rows)) + ')\nprint(json.dumps(summarize_runs(_rows), indent=2))';
      const result = await defaultCodeRunner.run(code);
      setCellOutput((previous) => ({
        ...previous, metrics: {
          success: result.exitCode === 0,
          text: (result.stdout + '\n' + result.stderr).trim() || 'No output.',
        },
      }));
    } finally { setRunningCell(null); }
  };

  const stats = (['reactive', 'intelligent'] as const).map((strategy) => {
    const subset = runs.filter((r) => r.strategy === strategy);
    return {
      strategy, count: subset.length,
      success: subset.filter((r) => r.success).length,
      successRate: subset.length ? (100 * subset.filter((r) => r.success).length / subset.length) : 0,
      meanTime: mean(subset.map((r) => r.elapsedMs)),
      meanBytes: mean(subset.map((r) => r.toolBytes)),
      meanMessages: mean(subset.map((r) => r.toolMessages)),
    };
  });

  const evidence = () => [
    'Lab 04: Reactive versus intelligent software repair agents',
    'Model: ' + MODEL + '. All experiments used the TypeScript compiler and the same case-specific regression suite.',
    ...runs.map((r) => r.issue + ' / ' + r.strategy + ': success=' + r.success +
      ', attempts=' + r.attempts + ', elapsed_ms=' + r.elapsedMs +
      ', tool_messages=' + r.toolMessages + ', tool_bytes=' + r.toolBytes +
      ', model_calls=' + r.modelCalls + ', total_model_tokens=' + r.modelTokens),
    'The communication metrics count JSON requests and replies exchanged with the browser compiler/test worker, not Internet packet traffic.',
  ].join('\n');

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
            {isInstructorPreview ? 'Student workspace preview · Unreleased' : 'Interactive notebook'}
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
            <h3 className="mt-1 text-lg font-semibold">01. A production service has three reported defects</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              You are supporting a TypeScript service used by a development team. Each issue includes its original
              source, expected behaviour and regression tests. Your agents must repair the implementation without modifying the tests.
              These are prepared classroom defects based on realistic failure modes, not claims of archived GitHub issues.
            </p>
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
            If stuck, open <strong>Show full-code hint</strong> next to the cell. Your changes are saved in this browser.
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
              <details className="group max-w-full text-xs">
                <summary className="flex cursor-pointer items-center gap-1 font-medium text-blue-700">
                  <ChevronDown className="h-3.5 w-3.5" /> Show full-code hint
                </summary>
                <div className="mt-3 max-w-[740px] rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="mb-2 text-xs text-blue-800">Reference implementation for this function. Compare it with your approach before using it.</p>
                  <pre className="max-h-72 overflow-auto whitespace-pre-wrap font-mono text-xs leading-5">{exercise.solution}</pre>
                  <button type="button" onClick={() => updateCell(exercise.id, exercise.solution)}
                    className="mt-3 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-blue-800 ring-1 ring-blue-200">
                    Insert complete example
                  </button>
                </div>
              </details>
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
          <h3 className="mt-1 text-lg font-semibold">07. Get your Gemini API key and test the connection</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Open <a className="font-semibold text-blue-700 underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Google AI Studio API Keys</a>,
            sign in, and select <strong>Create API key</strong>. Copy your key into the field below.
            Your key is used only for requests during this session and is not saved in the notebook.
            Gemini free-tier availability and daily limits depend on your Google project.
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
            {busy && <span className="text-xs font-medium text-blue-700"><Activity className="mr-1 inline h-3 w-3 animate-pulse"/> Executing agent steps...</span>}
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
            <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2 text-xs font-medium text-slate-300">
              <Terminal className="h-4 w-4" /> Agent and compiler execution log
            </div>
            <pre aria-live="polite" className="max-h-72 min-h-28 overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-xs leading-6 text-emerald-200">
              {activity.length ? activity.join('\n\n') : 'Run an experiment to view model actions, compiler diagnostics and regression-test results.'}
            </pre>
          </div>
        </section>

        <section className="mb-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
          <p className="text-xs font-semibold text-blue-700">PART E · EXPERIMENTAL RESULTS</p>
          <h3 className="mt-1 text-lg font-semibold">09. Compare task success, runtime and communication overhead</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Each row is a real completed agent execution. Runtime includes Python decisions, model API calls,
            TypeScript compilation and regression testing. Tool messages and payload bytes measure JSON exchanges
            with the compiler/test worker. Gemini token usage is reported separately.
          </p>
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600"><tr>
                {['Issue', 'Agent', 'Success', 'Attempts', 'Time (ms)', 'Tool messages', 'Tool bytes', 'Model tokens'].map((label) =>
                  <th className="whitespace-nowrap border-b border-slate-200 px-3 py-3 font-semibold" key={label}>{label}</th>)}
              </tr></thead>
              <tbody>{runs.length ? runs.map((r, index) => (
                <tr key={index} className="border-t border-slate-100">
                  <td className="px-3 py-2">{r.issue}</td><td className="px-3 py-2">{r.strategy}</td>
                  <td className={'px-3 py-2 font-semibold ' + (r.success ? 'text-emerald-700' : 'text-red-700')}>{r.success ? 'Pass' : 'Fail'}</td>
                  <td className="px-3 py-2">{r.attempts}</td><td className="px-3 py-2">{r.elapsedMs}</td>
                  <td className="px-3 py-2">{r.toolMessages}</td><td className="px-3 py-2">{r.toolBytes}</td>
                  <td className="px-3 py-2">{r.modelTokens}</td>
                </tr>
              )) : <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-500">No experiment measurements yet. Run the agents first.</td></tr>}</tbody>
            </table>
          </div>
          {runs.length > 0 && (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="text-xs font-semibold">Observed repair success rate</h4>
                {stats.map((item) => <div key={item.strategy} className="mt-4">
                  <div className="mb-1 flex justify-between text-xs"><span className="capitalize">{item.strategy} ({item.success}/{item.count})</span><span>{item.successRate.toFixed(1)}%</span></div>
                  <div className="h-3 rounded bg-slate-100"><div className="h-3 rounded bg-blue-600" style={{ width: item.successRate + '%' }}/></div>
                </div>)}
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="text-xs font-semibold">Mean end-to-end runtime</h4>
                {stats.map((item) => <div key={item.strategy} className="mt-4">
                  <div className="mb-1 flex justify-between text-xs"><span className="capitalize">{item.strategy}</span><span>{item.count ? item.meanTime.toFixed(0) + ' ms' : 'No trials'}</span></div>
                  <div className="h-3 rounded bg-slate-100"><div className="h-3 rounded bg-emerald-600"
                    style={{ width: (Math.max(0, item.meanTime) / Math.max(1, ...stats.map((s) => s.meanTime)) * 100) + '%' }}/></div>
                </div>)}
              </div>
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <button disabled={!runs.length} onClick={downloadCsv} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold disabled:opacity-50">
              <Download className="h-4 w-4"/> Export measurements CSV
            </button>
            <button disabled={!runs.length} onClick={downloadTraces} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold disabled:opacity-50">
              <Download className="h-4 w-4"/> Export agent traces JSON
            </button>
          </div>
        </section>

        {exercises.filter((item) => item.id === 'metrics').map((exercise) => (
          <section key={exercise.id} className="mb-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="p-5 sm:px-7">
              <span className="text-xs font-semibold text-blue-700">Step {exercise.step} · Python data analysis</span>
              <h3 className="mt-1 text-base font-semibold">{exercise.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{exercise.explanation}</p>
            </div>
            <div className="border-y border-slate-100 bg-slate-50 px-5 py-2 text-xs text-slate-500">In [09] · Python 3</div>
            <Editor height={200} language="python" value={cells.metrics} onChange={(v) => updateCell('metrics', v || '')}
              options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, automaticLayout: true }}/>
            <div className="flex flex-wrap justify-between gap-2 border-t border-slate-100 p-4">
              <button disabled={busy || runningCell !== null} onClick={() => void runMetricsCell()}
                className="rounded-md bg-emerald-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
                {runningCell === 'metrics' ? 'Running...' : 'Run analysis cell'}
              </button>
              <details className="text-xs"><summary className="cursor-pointer font-medium text-blue-700">Show full-code hint</summary>
                <pre className="mt-3 max-w-[740px] overflow-x-auto rounded-lg bg-blue-50 p-3 font-mono text-xs">{exercise.solution}</pre>
                <button onClick={() => updateCell('metrics', exercise.solution)} className="mt-2 rounded border px-3 py-1.5 text-xs">Insert complete example</button>
              </details>
            </div>
            {cellOutput.metrics && <pre className="whitespace-pre-wrap break-words border-t p-4 font-mono text-xs">{cellOutput.metrics.text}</pre>}
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
