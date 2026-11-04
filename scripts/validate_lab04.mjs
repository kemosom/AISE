import fs from 'node:fs';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import ts from 'ts-browser';

const cases = JSON.parse(fs.readFileSync('labs/lab04-software-repair-agents/cases.json', 'utf8'));
const exercises = JSON.parse(fs.readFileSync('labs/lab04-software-repair-agents/exercises.json', 'utf8'));

function compile(source) {
  const options = { target: ts.ScriptTarget.ES2015, module: ts.ModuleKind.CommonJS, strict: true, noEmitOnError: true, skipLibCheck: true };
  const filename = '/a-analysis-case.ts';
  const host = ts.createCompilerHost(options);
  const original = host.getSourceFile.bind(host);
  host.getSourceFile = (file, version, onError, createNew) =>
    file === filename ? ts.createSourceFile(file, source, version, true) : original(file, version, onError, createNew);
  let output = '';
  host.writeFile = (file, contents) => { if (file.endsWith('.js')) output = contents; };
  const program = ts.createProgram([filename], options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length === 0) program.emit();
  return { diagnostics, output };
}

const workerText = fs.readFileSync('src/workers/lab04-tests.worker.ts', 'utf8');
const workerJavaScript = ts.transpileModule(workerText, {
  compilerOptions: { target: ts.ScriptTarget.ES2015, module: ts.ModuleKind.CommonJS }
}).outputText;
function runTests(issueId, code) {
  let result;
  const worker = { postMessage(message) { result = message; } };
  const context = vm.createContext({ self: worker, exports: {}, console });
  vm.runInContext(workerJavaScript, context, { timeout: 1000 });
  worker.onmessage({ data: { issue: issueId, code } });
  if (!result) throw new Error('Worker returned no test results for ' + issueId);
  return result;
}

const fixes = {
  checkout: (s) => s.replace('return String(order.amountCents + taxCents);', 'return order.amountCents + taxCents;'),
  queue: (s) => s.replace(
    'return [...jobs].sort((a, b) => a.createdAt - b.createdAt)[0] ?? null;',
    "const rank = { critical: 0, high: 1, normal: 2 };\n  return [...jobs].sort((a, b) => rank[a.priority] - rank[b.priority] || a.createdAt - b.createdAt)[0] ?? null;"
  ),
  security: (s) => s.replace(
    "if ('authorization' in cleaned) {\n    cleaned.authorization = '[REDACTED]';\n  }",
    "for (const name of Object.keys(cleaned)) {\n    if (['authorization', 'cookie', 'set-cookie', 'x-api-key', 'proxy-authorization'].indexOf(name.toLowerCase()) >= 0) {\n      cleaned[name] = '[REDACTED]';\n    }\n  }"
  )
};

for (const issue of cases) {
  const before = compile(issue.source);
  if (issue.id === 'checkout') {
    if (!before.diagnostics.some((d) => d.code === 2322)) throw new Error('Checkout original no longer reproduces TS2322');
  } else {
    if (before.diagnostics.length) throw new Error(issue.id + ' unexpectedly fails compilation');
    const initial = runTests(issue.id, before.output);
    if (initial.passed) throw new Error(issue.id + ' original regression checks unexpectedly pass');
  }
  const fixed = compile(fixes[issue.id](issue.source));
  if (fixed.diagnostics.length || !fixed.output) {
    throw new Error(issue.id + ' reference repair failed typechecking: ' +
      fixed.diagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('\n'));
  }
  const tested = runTests(issue.id, fixed.output);
  if (!tested.passed) throw new Error(issue.id + ' reference repair failed tests: ' + JSON.stringify(tested));
  console.log('PASS ' + issue.id + ': original defect reproduced and corrected code passed ' + tested.results.length + ' regression assertions');
}

for (const exercise of exercises) {
  const check = spawnSync('python3', ['-c', exercise.solution + '\n\n' + exercise.verification], { encoding: 'utf8', timeout: 10000 });
  if (check.status !== 0 || !check.stdout.includes('PASS:')) {
    throw new Error('Python notebook reference for ' + exercise.id + ' failed:\n' + check.stderr + '\n' + check.stdout);
  }
  console.log('PASS notebook cell: ' + exercise.id);
}
console.log('Lab 04: typechecking, regression tests and Python reference cells verified.');
