import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import ts from 'ts-browser';

function evaluateModule(path) {
  const source = fs.readFileSync(path, 'utf8');
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: path,
  }).outputText;
  const output = { exports: {} };
  vm.runInNewContext(js, { module: output, exports: output.exports }, { timeout: 5000 });
  return output.exports;
}

const compiler = fs.readFileSync('src/lib/lab04-engine.ts', 'utf8');
assert.ok(!compiler.includes('ts.ModuleResolutionKind.Classic'),
  'Do not use deprecated Classic module resolution (TS5107).');

const banks = JSON.parse(fs.readFileSync('labs/lab04-software-repair-agents/hint-questions.json','utf8'));
for (const id of ['context','reactive','intelligent','metrics']) {
  assert.ok(Array.isArray(banks[id]) && banks[id].length >= 6, id + ' must have six or more quiz questions');
  for (const item of banks[id]) {
    assert.equal(item.options.length, 4);
    assert.ok(item.correct >= 0 && item.correct < 4);
    assert.equal(new Set(item.options).size, 4, 'Duplicate options in '+item.id);
    assert.ok(item.question.length > 25);
  }
}
console.log('PASS: question banks and correct indices');

const stats = evaluateModule('src/lib/lab04-statistics.ts');
const sample = [
  { issue:'checkout', strategy:'reactive', success:true, status:'Resolved', attempts:1,
    elapsedMs:1100, toolBytes:120, toolMessages:2, modelTokens:300, modelCalls:1 },
  { issue:'checkout', strategy:'intelligent', success:false, status:'Unresolved', attempts:3,
    elapsedMs:4200, toolBytes:300, toolMessages:6, modelTokens:900, modelCalls:3 },
  { issue:'queue', strategy:'reactive', success:false, status:'API error', attempts:0,
    elapsedMs:30000, toolBytes:0, toolMessages:0, modelTokens:0, modelCalls:1 },
  { issue:'security', strategy:'intelligent', success:true, status:'Resolved', attempts:2,
    elapsedMs:2600, toolBytes:280, toolMessages:4, modelTokens:500, modelCalls:2 },
];
const computed = stats.summarizeLab04(sample);
assert.equal(computed.validCount, 3);
assert.equal(computed.errorCount, 1);
assert.equal(computed.overall.reactive.successRate, 100);
assert.equal(computed.overall.intelligent.successRate, 50);
assert.equal(computed.overall.reactive.meanMs, 1100);
assert.equal(computed.perIssue[0].intelligent.meanToolBytes, 300);
assert.equal(computed.perIssue[1].reactive.n, 0);
assert.equal(computed.perIssue[1].reactive.successRate, null);
console.log('PASS: errors excluded, per-issue and overall statistics correct');

const pythonFactory = evaluateModule('src/lib/lab04-analysis-python.ts');
const headers = ['issue','strategy','success','attempts','modelCalls','modelTokens','toolMessages','toolBytes','elapsedMs','status'];
const csv = [headers.join(','), ...sample.map((r) => headers.map((h) =>
  '"' + String(r[h] ?? '').replace(/"/g, '""') + '"'
).join(','))].join('\r\n');
const solutions = JSON.parse(fs.readFileSync('labs/lab04-software-repair-agents/exercises.json','utf8'));
const studentCode = solutions.find((item)=>item.id === 'metrics').solution;
const python = pythonFactory.buildLab04PythonAnalysis(studentCode, csv) +
  '\nprint("FIGURE_COUNT:", len(plt.get_fignums()))\n';
const check = spawnSync('python3', ['-c', python], {
  encoding: 'utf8', timeout: 30000, maxBuffer: 2_000_000, env: { ...process.env, MPLBACKEND:'Agg' }
});
if (check.status !== 0) {
  throw new Error('Python CSV analysis failed:\n'+check.stderr+'\n'+check.stdout);
}
assert.match(check.stdout, /completed repairs:\s*3/);
assert.match(check.stdout, /excluded API\/execution errors:\s*1/);
assert.match(check.stdout, /PER-ISSUE BREAKDOWN/);
assert.match(check.stdout, /FIGURE_COUNT:\s*5/);
console.log('PASS: Python CSV parsing, per-issue table, and five matplotlib figures');
