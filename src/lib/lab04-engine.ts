import type { Lab04Issue } from '../../labs/lab04-software-repair-agents/types';

export type TestCheck = { name: string; passed: boolean; error?: string };
export type BuildResult = {
  passed: boolean;
  compilationPassed: boolean;
  diagnostics: string[];
  checks: TestCheck[];
  elapsedMs: number;
  messages: number;
  bytes: number;
};

function countBytes(payload: unknown): number {
  return new TextEncoder().encode(JSON.stringify(payload)).length;
}

export async function compileAndTest(issue: Lab04Issue, source: string): Promise<BuildResult> {
  const started = performance.now();
  const input = { issue: issue.id, source };
  const [tsModule, es5, core, iterable, symbol, symbolWellKnown, collection] = await Promise.all([
    import('typescript'),
    import('typescript/lib/lib.es5.d.ts?raw'),
    import('typescript/lib/lib.es2015.core.d.ts?raw'),
    import('typescript/lib/lib.es2015.iterable.d.ts?raw'),
    import('typescript/lib/lib.es2015.symbol.d.ts?raw'),
    import('typescript/lib/lib.es2015.symbol.wellknown.d.ts?raw'),
    import('typescript/lib/lib.es2015.collection.d.ts?raw'),
  ]);
  const ts = tsModule.default || tsModule;
  const files: Record<string, string> = {
    '/main.ts': source,
    '/lib.es5.d.ts': es5.default,
    '/lib.es2015.core.d.ts': core.default,
    '/lib.es2015.iterable.d.ts': iterable.default,
    '/lib.es2015.symbol.d.ts': symbol.default,
    '/lib.es2015.symbol.wellknown.d.ts': symbolWellKnown.default,
    '/lib.es2015.collection.d.ts': collection.default,
  };
  const options = {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2015,
    strict: true,
    noLib: true,
    noEmitOnError: true,
    skipLibCheck: true,
    moduleResolution: ts.ModuleResolutionKind.Classic,
  };
  let emitted = '';
  const host = {
    getSourceFile: (file: string, language: any) =>
      Object.prototype.hasOwnProperty.call(files, file) ? ts.createSourceFile(file, files[file], language, true) : undefined,
    getDefaultLibFileName: () => '',
    writeFile: (path: string, text: string) => { if (path.endsWith('main.js')) emitted = text; },
    getCurrentDirectory: () => '/',
    getDirectories: () => [],
    fileExists: (path: string) => Object.prototype.hasOwnProperty.call(files, path),
    readFile: (path: string) => files[path],
    useCaseSensitiveFileNames: () => true,
    getCanonicalFileName: (path: string) => path,
    getNewLine: () => '\n',
  };
  const program = ts.createProgram(Object.keys(files), options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program).map((diagnostic: any) => {
    const position = diagnostic.file && diagnostic.start !== undefined
      ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
      : undefined;
    const location = position ? (position.line + 1) + ':' + (position.character + 1) + ' ' : '';
    return (diagnostic.file?.fileName === '/main.ts' ? issue.file + ':' : '') +
      location + 'TS' + diagnostic.code + ': ' + ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ');
  });
  if (!diagnostics.length) program.emit();
  if (diagnostics.length || !emitted) {
    const result = { passed: false, compilationPassed: false, diagnostics: diagnostics.length ? diagnostics : ['Compiler emitted no JavaScript.'], checks: [] as TestCheck[], elapsedMs: Math.round(performance.now() - started), messages: 2, bytes: 0 };
    result.bytes = countBytes(input) + countBytes(result);
    return result;
  }

  const workerResult = await new Promise<{ results: TestCheck[]; passed: boolean; error?: string }>((resolve, reject) => {
    const worker = new Worker(new URL('../workers/lab04-tests.worker.ts', import.meta.url), { type: 'module' });
    const timeout = window.setTimeout(() => { worker.terminate(); reject(new Error('Tests exceeded the 5-second execution limit.')); }, 5000);
    worker.onmessage = (event) => {
      window.clearTimeout(timeout);
      worker.terminate();
      resolve(event.data);
    };
    worker.onerror = (event) => {
      window.clearTimeout(timeout);
      worker.terminate();
      reject(new Error(event.message || 'Test worker failed.'));
    };
    worker.postMessage({ issue: issue.id, code: emitted });
  });

  const result: BuildResult = {
    passed: workerResult.passed,
    compilationPassed: true,
    diagnostics: workerResult.error ? [workerResult.error] : [],
    checks: workerResult.results || [],
    elapsedMs: Math.round(performance.now() - started),
    messages: 4,
    bytes: 0,
  };
  result.bytes =
    countBytes(input) +
    countBytes({ compilationPassed: true }) +
    countBytes({ issue: issue.id, code: emitted }) +
    countBytes(workerResult);
  return result;
}

export function buildFeedback(result: BuildResult): string {
  if (!result.compilationPassed) return 'Compilation failed:\n' + result.diagnostics.join('\n');
  const failures = result.checks.filter((check) => !check.passed);
  if (result.passed) return 'Compilation succeeded. All ' + result.checks.length + ' regression checks passed.';
  return 'Compilation succeeded, but ' + failures.length + ' regression checks failed:\n' +
    failures.map((check) => '- ' + check.name + ': ' + (check.error || 'Assertion failed')).join('\n');
}

export function extractTypeScriptSource(answer: string): string {
  const fenced = answer.match(/`{3}(?:typescript|ts)?\s*\n([\s\S]*?)`{3}/i);
  const raw = (fenced ? fenced[1] : answer).trim();
  if (!raw || raw.length > 18000) throw new Error('Model returned an empty or oversized source file.');
  if (!raw.includes('export ')) throw new Error('Model response does not contain an exported TypeScript function.');
  return raw;
}

export type RepairRun = {
  issue: string;
  strategy: 'reactive' | 'intelligent';
  success: boolean;
  attempts: number;
  modelCalls: number;
  modelTokens: number;
  toolMessages: number;
  toolBytes: number;
  elapsedMs: number;
  status: string;
  trace: string[];
  finalSource: string;
};

export function resultsToCsv(rows: RepairRun[]): string {
  const headers = ['issue', 'strategy', 'success', 'attempts', 'modelCalls', 'modelTokens', 'toolMessages', 'toolBytes', 'elapsedMs', 'status'];
  const escape = (value: unknown) => '"' + String(value ?? '').replace(/"/g, '""') + '"';
  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape((r as any)[h])).join(','))].join('\r\n');
}

export function saveTextFile(name: string, content: string, mime = 'text/plain'): void {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
