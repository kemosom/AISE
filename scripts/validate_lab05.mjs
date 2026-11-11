import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import ts from 'ts-browser';

const payload = JSON.parse(fs.readFileSync('api/instructor/lab05.json', 'utf8'));
const handlerSource = fs.readFileSync('api/instructor.ts', 'utf8');
const compiled = ts.transpileModule(handlerSource, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, resolveJsonModule: true, esModuleInterop: true },
}).outputText;
// Exercise the native ESM loader used by the deployed server function.
const esmDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lab05-esm-'));
try {
  fs.mkdirSync(path.join(esmDirectory, 'instructor'));
  fs.copyFileSync('api/instructor/lab05.json', path.join(esmDirectory, 'instructor/lab05.json'));
  const esmFile = path.join(esmDirectory, 'instructor.mjs');
  fs.writeFileSync(esmFile, ts.transpileModule(handlerSource, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText);
  assert.equal(typeof (await import(pathToFileURL(esmFile).href)).default, 'function');
} finally {
  fs.rmSync(esmDirectory, { recursive: true, force: true });
}
const localExports = {};
const environment = {
  ...process.env,
  INSTRUCTOR_ADMIN_CODE: 'local-test-code',
  INSTRUCTOR_CONTENT_KEY: Buffer.alloc(32, 1).toString('base64url'),
};
vm.runInNewContext(compiled, {
  exports: localExports,
  require: createRequire(new URL('../api/instructor.ts', import.meta.url)),
  Buffer,
  process: { env: environment },
  console,
});
function request(method, body) {
  const response = { code: 200, body: null, headers: {} };
  const res = {
    setHeader(name, value) { response.headers[name] = value; },
    status(code) { response.code = code; return this; },
    json(value) { response.body = value; return this; },
  };
  localExports.default({ method, body }, res);
  return response;
}
for (const code of [undefined, '', 'wrong-code']) {
  const denied = request('POST', { labId: payload.labId, code });
  assert.equal(denied.code, 401);
  assert.ok(!JSON.stringify(denied.body).includes('summarise_readings'));
}
assert.equal(request('GET').body.manifest, undefined);
const allowed = request('POST', { labId: payload.labId, code: 'local-test-code' });
assert.equal(allowed.code, 200);
assert.equal(allowed.body.data.manifest.starterFiles.length, 9);
assert.match(allowed.headers['Cache-Control'], /no-store/);
const app = fs.readFileSync('src/App.tsx', 'utf8');
assert.ok(app.includes('const isUnlocked = manifest.labNumber <= 5;'));
assert.ok(app.includes('labs={labs}'));
const studentManifest = JSON.parse(fs.readFileSync('labs/lab05-artifact-generation/manifest.json', 'utf8'));
assert.deepEqual(studentManifest, payload.manifest);
assert.equal(studentManifest.instructorNotes, undefined);
assert.ok(fs.readFileSync('src/components/LabWorkspace.tsx', 'utf8').includes('loadedManifest.labNumber > 5'));
assert.ok(fs.readFileSync('labs/registry.ts', 'utf8').includes("labRegistryMap.set('lab05-artifact-generation', lab05Manifest as LabManifest)"));
assert.ok(app.includes('instructorManifest={isInstructorPreview ? instructorData?.manifest : undefined}'));
console.log('PASS complete Lab 05 student manifest is released and instructor notes require validation.');

const python = String.raw`
import contextlib
import io
import json
import os
from pathlib import Path
import tempfile

payload = json.loads(Path("api/instructor/lab05.json").read_text())
manifest = payload["manifest"]
with tempfile.TemporaryDirectory() as directory:
    for file in manifest["starterFiles"]:
        Path(directory, file["name"]).write_text(file["content"])
    os.chdir(directory)
    scope = {"__name__": "__main__", "_LAB05_VERIFY": True}
    exec(compile(Path("main.py").read_text(), "main.py", "exec"), scope)
    data, _ = scope["load_namespace"]("cases.py")
    baseline, _ = scope["load_namespace"]("baseline.py")
    rows = scope["evaluate"](baseline["summarise_readings"], data["PUBLIC_CASES"])
    assert sum(row["passed"] for row in rows) == 5

    reference = {}
    exec(payload["instructorNotes"]["referenceCode"], reference)
    rows = scope["evaluate"](reference["summarise_readings"], data["PUBLIC_CASES"])
    assert all(row["passed"] for row in rows)
    actual = [reference["summarise_readings"](data["TIMELINE_PACKETS"], now)["node-01"]["status"]
              for now in data["TIMELINE_TIMES"]]
    assert actual == data["TIMELINE_EXPECTED"]
    for name in ("generated_a1.py", "generated_a2.py", "generated_b1.py", "generated_b2.py", "analysis.py"):
        Path(name).write_text(payload["instructorNotes"]["referenceCode"])
    with Path("cases.py").open("a") as stream:
        stream.write('''
EXTRA_CASES.extend([
 dict(id="X01", name="Negative measurement", now=100,
      packets=[packet(measured_at=-1, received_at=0)], expected=expected()),
 dict(id="X02", name="Fractional age", now=119.5, packets=[packet()],
      expected=expected(state("NORMAL",25.0,90,29.5))),
])
''')
    with Path("generation_log.py").open("a") as stream:
        stream.write('''
for entry in GENERATIONS.values():
    entry["tool_model"] = "Reference verification fixture"
    entry["date_time"] = "2026-11-11"
''')
    for test in manifest["tests"]:
        exec(test["testCode"], scope)
    output = io.StringIO()
    with contextlib.redirect_stdout(output):
        scope["run_experiment"]()
    line = next(line for line in output.getvalue().splitlines() if line.startswith("LAB05_RESULTS="))
    records = json.loads(line.split("=",1)[1])
    assert len(records) == 5
    assert all(record["passed"] == 18 for record in records[1:])
    assert all(record["scores"]["false_current"] == 0 for record in records[1:])

    # A bad return value is a failed execution, rather than a broken export.
    invalid = scope["evaluate"](lambda *args: {"bad": float("nan")}, data["PUBLIC_CASES"][:1])
    assert invalid[0]["error"] and invalid[0]["actual"] is None
    print("PASS baseline defects, all sixteen contract cases, temporal replay, eight verification checks and four complete artefact evaluations.")
`;
const checked = spawnSync('python3', ['-c', python], {
  encoding: 'utf8', timeout: 30000, env: { ...process.env, MPLBACKEND: 'Agg' },
});
assert.equal(checked.status, 0, checked.stderr + checked.stdout);
console.log(checked.stdout.trim());
