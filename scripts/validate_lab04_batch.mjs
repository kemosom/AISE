import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'ts-browser';

const notebook = fs.readFileSync('src/components/Lab04Notebook.tsx','utf8');
const runAll = notebook.split('const runAll = async () => {')[1]?.split('const runMetricsCell = async () => {')[0];
assert.ok(runAll, 'Run all implementation exists');
assert.ok(!runAll.includes('window.confirm'), 'Run all should not display a confirmation dialog');
assert.match(runAll, /for \(const issue of cases\)/, 'Must execute every issue');
assert.match(runAll, /for \(const strategy of \['reactive', 'intelligent'\]/);
assert.match(runAll, /completed\+\+;/);
assert.match(runAll, /setRuns\(\[\]\)/, 'Run all should reset the stale partial dataset');
assert.ok(!runAll.includes("Batch stopped"), 'An API error must not stop the batch');
assert.match(notebook, /Repetitions per issue/);
assert.match(notebook, /ref=\{terminalRef\}/);
assert.match(notebook, /data\.retryable === true/);
assert.match(notebook, /modelCalls\+\+/);
console.log('PASS: no run-all modal, complete issue/strategy traversal and visible progress');

const analysis = fs.readFileSync('src/components/Lab04Analysis.tsx','utf8');
assert.ok(!analysis.includes('How to interpret these measurements'));
assert.ok(!analysis.includes('completed repair trials.</strong>'));
assert.match(analysis, /View error details/);
assert.ok(!notebook.includes('View original laboratory source files'));
console.log('PASS: data-coverage, ceiling-effect and retry interpretation');

const py = fs.readFileSync('src/lib/lab04-analysis-python.ts','utf8');
assert.ok(py.includes('INTERPRETATION') && py.includes('float(') && py.includes('nan'),
  'Python analysis must explain actual results and treat absent issue groups as N/A');
console.log('PASS: CSV analysis interpretation and absent-issue handling');

const serverText = fs.readFileSync('api/lab04-model.ts','utf8');
assert.match(serverText, /thinkingLevel: 'low'/);
assert.match(serverText, /maxOutputTokens: 8192/);
const js = ts.transpileModule(serverText,{
  fileName:'api/lab04-model.ts',
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText;

async function makeRequest(fakeGemini) {
  const mod = {exports:{}};
  const request = {method:'POST',body:{key:'test-api-key',prompt:'Fix this TypeScript file. Return only complete code.'}};
  let answer, status=200, outbound, upstreamHeaders;
  const reply = {
    setHeader(){return reply;},
    status(v){status=v;return reply;},
    json(v){answer=v;return reply;},
  };
  const context = {
    module:mod,exports:mod.exports,AbortController,JSON,Error,setTimeout,clearTimeout,
    fetch:async(url,args)=>{
      outbound=JSON.parse(args.body);
      upstreamHeaders=args.headers;
      return {status:fakeGemini.status||200,ok:!fakeGemini.status||fakeGemini.status===200,
        json:async()=>fakeGemini.data};
    },
  };
  vm.runInNewContext(js,context,{timeout:5000});
  await mod.exports.default(request,reply);
  return {answer,status,outbound,upstreamHeaders};
}

const successful = await makeRequest({
  data:{candidates:[{finishReason:'STOP',content:{parts:[{text:'export const n: number = 1;'}]}}],
    usageMetadata:{promptTokenCount:24,candidatesTokenCount:9,thoughtsTokenCount:4}},
});
assert.equal(successful.status,200);
assert.equal(successful.answer.text,'export const n: number = 1;');
assert.equal(successful.answer.thoughtTokens,4);
assert.equal(successful.outbound.generationConfig.thinkingConfig.thinkingLevel,'low');
assert.equal(successful.outbound.generationConfig.maxOutputTokens,8192);
assert.equal(successful.upstreamHeaders['x-goog-api-key'],'test-api-key');
assert.ok(!JSON.stringify(successful.answer).includes('test-api-key'));
console.log('PASS: Gemini source code response and token accounting');

const empty = await makeRequest({
  data:{candidates:[{finishReason:'MAX_TOKENS',content:{parts:[]}}],
    usageMetadata:{promptTokenCount:30,thoughtsTokenCount:8192}},
});
assert.equal(empty.status,502);
assert.equal(empty.answer.retryable,true);
assert.equal(empty.answer.code,'EMPTY_OUTPUT');
assert.equal(empty.answer.usageTokens, 8222, 'Billable thought tokens should not disappear on empty output');
assert.match(empty.answer.error,/token budget/);
console.log('PASS: no-source Gemini response is diagnosed correctly');

const unavailable = await makeRequest({
  status:503,data:{error:{message:'Service temporarily unavailable'}}
});
assert.equal(unavailable.status,502);
assert.equal(unavailable.answer.retryable,true);
assert.match(unavailable.answer.error,/503/);
console.log('PASS: transient provider failure is retryable');
