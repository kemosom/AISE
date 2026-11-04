import React from 'react';
import { ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';

interface Props {
  onOpenNotebook: () => void;
}

const Section: React.FC<{ number: string; title: string; children: React.ReactNode }> = ({
  number, title, children,
}) => (
  <section className="border-t border-slate-200 pt-7">
    <h2 className="flex items-center gap-3 text-lg font-semibold text-slate-950">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
        {number}
      </span>
      {title}
    </h2>
    <div className="mt-3 space-y-3 text-[15px] leading-7 text-slate-700">{children}</div>
  </section>
);

export const Lab04Theory: React.FC<Props> = ({ onOpenNotebook }) => (
  <main className="h-full overflow-y-auto bg-slate-50">
    <div className="mx-auto max-w-3xl px-5 pb-14 pt-8 sm:px-9">
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
          <BookOpen className="h-4 w-4" /> Lab 04 · Read before you start
        </div>
        <h1 className="mt-3 text-2xl font-semibold leading-tight text-slate-950 sm:text-3xl">
          How can AI help us fix software?
        </h1>
        <p className="mt-4 text-[15px] leading-7 text-slate-700">
          Imagine you work on a software team. Someone reports that part of your application is not working.
          You need to find the problem, change the code, and check that the change works.
          In this lab, you will write a small Python program that asks an AI coding model for help
          and decides what to do after the code is tested.
        </p>
        <p className="mt-3 text-[15px] leading-7 text-slate-700">
          You will build two ways of doing this job, run them on the same problems, and compare the results.
        </p>

        <Section number="1" title="What software are we fixing?">
          <p>Our example application has three small problems. Each one affects a different part of the software.</p>
          <div className="grid gap-3">
            <div className="rounded-lg border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900">Checkout: the total has the wrong type</h3>
              <p className="mt-1">A function should return an amount as a number of cents. It returns text instead. The TypeScript compiler notices this mistake.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-md bg-rose-50 px-3 py-2 font-mono text-xs text-rose-800">
                  Wrong: return String(total);
                </div>
                <div className="rounded-md bg-emerald-50 px-3 py-2 font-mono text-xs text-emerald-800">
                  Correct: return total;
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900">Queue: urgent tickets are not handled first</h3>
              <p className="mt-1">The program chooses an older normal ticket before a newer critical ticket. It compiles, but a test shows that its decision is wrong.</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900">Security: private information appears in logs</h3>
              <p className="mt-1">The program should hide passwords and access keys in request headers. Some header names are not hidden correctly. Tests check whether private values remain exposed.</p>
            </div>
          </div>
          <p>These three problems were written for this lab. They are examples, not reports copied from a real company's system. The code is compiled and tested for real in your browser.</p>
        </Section>

        <Section number="2" title="What does it mean to fix code with AI?">
          <p>You give the coding model the problem report, the source code, and the reason the current program failed. The model returns a suggested replacement source file.</p>
          <p><strong>That suggestion is not automatically correct.</strong> We must compile it and run tests before deciding that the problem has been fixed.</p>
          <div className="grid gap-2 rounded-lg bg-slate-50 p-4 text-center text-sm font-medium text-slate-800">
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">Read the problem and source code</div>
            <div className="text-slate-400">↓</div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">Ask Gemini to generate corrected code</div>
            <div className="text-slate-400">↓</div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">Compile the code and run tests</div>
            <div className="text-slate-400">↓</div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">Finish if it passes, or decide whether to try again</div>
          </div>
          <p>The corrected source file is the <strong>generated software artifact</strong>. In simple terms, an artifact is a file produced during software development.</p>
        </Section>

        <Section number="3" title="What is an agent?">
          <p>Think of Gemini as a programmer you can ask for a correction. The <strong>agent</strong> is the set of Python rules that decides when to ask, what information to send, and when to stop.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="font-semibold text-blue-950">Reactive agent</h3>
              <p className="mt-2 text-sm leading-6">It asks for <strong>one</strong> repair. The code is checked. If the patch fails, the agent stops. It does not ask for a second patch.</p>
            </div>
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
              <h3 className="font-semibold text-teal-950">Intelligent agent</h3>
              <p className="mt-2 text-sm leading-6">It reads the results of the previous repair. If the tests fail, it can send that feedback to Gemini and try again, for up to <strong>three</strong> patches.</p>
            </div>
          </div>
          <p>Both agents use the same coding model. The difference is their <strong>decision rules</strong>. The intelligent agent does not train a new AI model. It simply uses test feedback when asking for another correction.</p>
        </Section>

        <Section number="4" title="What will you write in Python?">
          <p>You will complete three functions. A function is a small part of a program that does one job.</p>
          <div className="space-y-3">
            <div><code className="rounded bg-slate-100 px-2 py-1 text-sm font-semibold text-slate-900">select_context()</code>
              <p className="mt-2">Find the source file mentioned in the problem and return its code. If the file is not available, report an error.</p></div>
            <div><code className="rounded bg-slate-100 px-2 py-1 text-sm font-semibold text-slate-900">reactive_agent()</code>
              <p className="mt-2">Decide whether to ask for the first patch, finish after success, or stop after one unsuccessful patch.</p></div>
            <div><code className="rounded bg-slate-100 px-2 py-1 text-sm font-semibold text-slate-900">intelligent_agent()</code>
              <p className="mt-2">Read the most recent failure, decide whether another correction is allowed, and include feedback in the next request.</p></div>
          </div>
          <p>Each cell has a <strong>Run cell</strong> button. This checks your Python code. If you need help, answer three short questions to unlock a complete example. You can retry the questions.</p>
        </Section>

        <Section number="5" title="Why compile and test the code?">
          <p><strong>Compilation</strong> checks whether the code follows the TypeScript language rules. The checkout problem fails this check because text is returned where a number is required.</p>
          <p><strong>Testing</strong> checks what the program actually does. Queue and security code may compile successfully but still behave incorrectly.</p>
          <p>A repair counts as successful only when the corrected code compiles <strong>and</strong> all the checks for that problem pass.</p>
        </Section>

        <Section number="6" title="What will you compare?">
          <p>Run both agents on checkout, queue, and security. Each agent starts with the same original broken code for that problem.</p>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[450px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-900"><tr><th className="px-3 py-2">Measurement</th><th className="px-3 py-2">What it means</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                <tr><td className="px-3 py-2 font-medium">Success</td><td className="px-3 py-2">Did the corrected code pass all tests?</td></tr>
                <tr><td className="px-3 py-2 font-medium">Time</td><td className="px-3 py-2">How long did the complete repair run take?</td></tr>
                <tr><td className="px-3 py-2 font-medium">Patches</td><td className="px-3 py-2">How many corrections did the model generate?</td></tr>
                <tr><td className="px-3 py-2 font-medium">Worker messages and bytes</td><td className="px-3 py-2">How much information was sent to and from the program that runs the tests?</td></tr>
                <tr><td className="px-3 py-2 font-medium">Model tokens</td><td className="px-3 py-2">How much text-processing work did the model use? These are not network bytes.</td></tr>
              </tbody>
            </table>
          </div>
          <p><strong>A 100% success rate is possible for both agents.</strong> That only means both solved the observed problems. If the first patch worked, the intelligent agent did not need to try again.</p>
          <p>If a model request fails or the Python runner has a problem, the run is marked as an error. This is different from a patch failing a software test.</p>
        </Section>

        <Section number="7" title="What happens after the experiments?">
          <p>The final Python cell, <code className="rounded bg-slate-100 px-1 text-sm">summarize_runs()</code>, calculates success rates and average measurements using the experiment records.</p>
          <p>The results section shows tables and figures. In the report, explain what your agents did, which problems were fixed, what the tests reported, and what you learned from the comparison.</p>
          <p>Use your measured results. Do not assume that one strategy is better simply because it has more chances to try.</p>
        </Section>

        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-950">
            <CheckCircle2 className="h-4 w-4" /> Before opening the notebook
          </div>
          <p className="mt-2 text-sm leading-6 text-blue-900">
            You should now know what the three software problems are, why the agents make different decisions,
            and why every generated patch must be compiled and tested.
          </p>
        </div>
        <button type="button" onClick={onOpenNotebook}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 sm:w-auto">
          Open Notebook <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  </main>
);
