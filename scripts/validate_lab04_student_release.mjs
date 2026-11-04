import fs from 'node:fs';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const cases = JSON.parse(fs.readFileSync('labs/lab04-software-repair-agents/cases.json', 'utf8'));
const exercises = Object.fromEntries(JSON.parse(fs.readFileSync('labs/lab04-software-repair-agents/exercises.json','utf8')).map(x=>[x.id,x]));

for (const c of cases) {
  assert.ok(c.sources?.length >= 1);
  for (const source of c.sources) {
    assert.match(source.url,/^https:\/\//);
    assert.ok(source.note.length > 30, 'Document whether reference code was imported or lab authored');
  }
}
const app = fs.readFileSync('src/App.tsx','utf8');
const workspace = fs.readFileSync('src/components/LabWorkspace.tsx','utf8');
const ui = fs.readFileSync('src/components/Lab04Notebook.tsx','utf8');
const analysis = fs.readFileSync('src/components/Lab04Analysis.tsx','utf8');
assert.ok(app.includes('const isUnlocked = manifest.labNumber <= 4'));
assert.ok(!app.includes('manifest.labNumber !== 4'));
assert.ok(workspace.includes('loadedManifest.labNumber > 4'));
const theory = fs.readFileSync('src/components/Lab04Theory.tsx','utf8');
const theoryText = fs.readFileSync('labs/lab04-software-repair-agents/theory.md','utf8');
assert.ok(workspace.includes("import { Lab04Theory } from './Lab04Theory';"));
assert.match(workspace, /<Lab04Theory onOpenNotebook=\{\(\) => setViewMode\('notebook'\)\}/);
assert.ok(workspace.includes("if (labId === 'lab04-software-repair-agents') {"));
assert.ok(workspace.includes("saved === 'theory' || saved === 'notebook' || saved === 'report'"));
assert.ok(workspace.includes("onClick={() => setViewMode('theory')}"));
assert.ok(workspace.includes("onClick={() => setViewMode('notebook')}"));
for (const label of ['What software are we fixing?', 'What is an agent?', 'What will you write in Python?',
  'Why compile and test the code?', 'What will you compare?', 'What happens after the experiments?']) {
  assert.ok(theory.includes(label), 'Missing Theory section: ' + label);
}
assert.ok(theory.includes('Open Notebook'));
assert.ok(theory.includes('not copied from a real'));
assert.ok(theory.includes('one') && theory.includes('three'));
assert.ok(theoryText.includes('Both agents use the same coding model'));
assert.ok(!theory.includes('github.com/kemosom/AISE'));
console.log('PASS: Lab 04 Theory tab, accessible explanations and notebook navigation');

assert.ok(!ui.includes('View original laboratory source files'));
assert.ok(!ui.includes('https://github.com/kemosom/AISE/blob/main/labs/lab04-software-repair-agents/cases.json'));
assert.ok(!ui.includes('View the regression test source'));
assert.ok(!ui.includes('https://github.com/kemosom/AISE/blob/main/src/workers/lab04-tests.worker.ts'));
assert.ok(!analysis.includes('How to interpret these measurements'));
assert.ok(!analysis.includes('completed repair trials.</strong>'));
assert.ok(ui.includes('Python policies validated on checkout, queue and security.'));
assert.ok(ui.includes('base64.b64decode('));
console.log('PASS: Lab 4 released in student dashboard, source provenance shown and noisy result banners removed');

function evaluatePolicy(issue, strategy, attempts=0, passed=false, history=[]) {
  const agentName = strategy + '_agent';
  const policySource = exercises[strategy].solution;
  const state = {
    issue: {id:issue.id,file:issue.file,report:issue.report},
    source:issue.source,
    feedback:'Compilation succeeded, but 1 regression check failed: expected behaviour did not match.',
    attempts, last_passed:passed, history,
    max_attempts:strategy==='reactive'?1:3,
  };
  const encoded = Buffer.from(JSON.stringify(state),'utf8').toString('base64');
  const py = [
    'import json, base64',
    exercises.context.solution,
    policySource,
    '_state = json.loads(base64.b64decode("'+encoded+'").decode("utf-8"))',
    '_issue = _state["issue"]',
    '_repository = {_issue["file"]: _state["source"]}',
    '_state["source"] = select_context(_issue, _repository)',
    '_decision = '+agentName+'(_state)',
    'print("LAB4_DECISION:" + json.dumps(_decision))'
  ].join('\n\n');
  const execution = spawnSync('python3',['-c',py],{encoding:'utf8',timeout:10000});
  if(execution.status!==0)throw new Error(issue.id+'/'+strategy+': '+execution.stderr);
  const line=execution.stdout.split('\n').find(x=>x.startsWith('LAB4_DECISION:'));
  assert.ok(line,issue.id+'/'+strategy+': missing decision marker');
  return JSON.parse(line.slice('LAB4_DECISION:'.length));
}
for(const issue of cases){
  for(const name of ['reactive','intelligent']){
    const initial=evaluatePolicy(issue,name);
    assert.equal(initial.action,'generate',issue.id+'/'+name);
    assert.ok(initial.prompt.includes(issue.file));
    assert.ok(initial.prompt.includes(issue.report));
    assert.ok(initial.prompt.includes(issue.source));
    const stopped=evaluatePolicy(issue,name,name==='reactive'?1:3,false,[{feedback:'Tests failed'}]);
    assert.equal(stopped.action,'stop',issue.id+'/'+name+' did not stop on budget');
    const passed=evaluatePolicy(issue,name,1,true,[{feedback:'All tests passed'}]);
    assert.equal(passed.action,'finish',issue.id+'/'+name+' did not stop on success');
  }
  console.log('PASS: '+issue.id+' source + both hinted agent policies + stop/finish decisions');
}
console.log('Integrated Lab 04 student hint policies validated against all three real lab fixtures.');
