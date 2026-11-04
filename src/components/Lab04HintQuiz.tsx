import React, { useState } from 'react';
import { CheckCircle2, ChevronDown, LockKeyhole, RefreshCw, X } from 'lucide-react';
import questionBanks from '../../labs/lab04-software-repair-agents/hint-questions.json';

type Question = { id: string; question: string; options: string[]; correct: number };
type Presented = Question & { shuffled: Array<{ index: number; label: string }> };
type Props = { exerciseId: string; source: string; onInsert: (code: string) => void };

const shuffle = <T,>(items: T[]): T[] => {
  const output = [...items];
  for (let i = output.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [output[i], output[j]] = [output[j], output[i]];
  }
  return output;
};
function drawQuestions(exerciseId: string): Presented[] {
  const banks = questionBanks as Record<string, Question[]>;
  return shuffle(banks[exerciseId] || []).slice(0, 3).map((q) => ({
    ...q,
    shuffled: shuffle(q.options.map((label, index) => ({ label, index }))),
  }));
}

export const Lab04HintQuiz: React.FC<Props> = ({ exerciseId, source, onInsert }) => {
  const [open, setOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [questions, setQuestions] = useState<Presented[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');
  const [attempts, setAttempts] = useState(0);

  const start = () => {
    setQuestions(drawQuestions(exerciseId));
    setAnswers({});
    setFeedback('');
    setOpen(true);
  };
  const retry = () => {
    setQuestions(drawQuestions(exerciseId));
    setAnswers({});
    setFeedback('');
  };
  const grade = () => {
    if (questions.some((question) => answers[question.id] === undefined)) {
      setFeedback('Answer all three questions before checking your responses.');
      return;
    }
    const correct = questions.filter((question) => answers[question.id] === question.correct).length;
    setAttempts((previous) => previous + 1);
    if (correct === 3) {
      setUnlocked(true);
      setOpen(false);
      setFeedback('');
    } else {
      // A failed submission starts a fresh checkpoint, with newly shuffled
      // questions and answer positions. There is no retry limit.
      setQuestions(drawQuestions(exerciseId));
      setAnswers({});
      setFeedback(correct + ' of 3 correct. A new set of questions is ready. Try again.');
    }
  };

  return (
    <div className="max-w-full">
      {!unlocked ? (
        <button type="button" onClick={start}
          className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100">
          <LockKeyhole className="h-3.5 w-3.5" /> Unlock full-code hint <ChevronDown className="h-3.5 w-3.5"/>
        </button>
      ) : (
        <details className="max-w-full text-xs" open>
          <summary className="flex cursor-pointer items-center gap-2 font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> Full-code hint unlocked
          </summary>
          <div className="mt-3 max-w-[750px] rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="mb-2 text-xs leading-5 text-blue-900">Reference implementation. Compare its decisions with your own code before inserting.</p>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-white p-3 font-mono text-xs leading-5 text-slate-800">{source}</pre>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => onInsert(source)}
                className="rounded-md border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100">
                Insert complete example
              </button>
              <button type="button" onClick={start}
                className="rounded-md px-3 py-2 text-xs text-slate-600 hover:bg-white">
                Practise another quiz
              </button>
            </div>
          </div>
        </details>
      )}

      {open && (
        <div role="presentation" className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <div role="dialog" aria-modal="true" aria-label="Code hint checkpoint"
            className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-blue-700">Code hint checkpoint</div>
                <h4 className="mt-1 text-base font-semibold text-slate-900">Answer three questions to reveal the code</h4>
                <p className="mt-1 text-xs leading-5 text-slate-600">Choose one answer for each question. All three must be correct. You may try as many times as needed.</p>
              </div>
              <button aria-label="Close checkpoint" type="button" onClick={() => setOpen(false)} className="rounded-md p-1 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5"/></button>
            </div>
            <div className="max-h-[min(65vh,590px)] space-y-5 overflow-y-auto px-5 py-4">
              {questions.map((question, index) => (
                <fieldset key={question.id} className="rounded-lg border border-slate-200 p-3">
                  <legend className="px-1 text-xs font-semibold text-slate-800">Question {index + 1} of 3</legend>
                  <p className="mb-3 text-sm font-medium leading-6 text-slate-900">{question.question}</p>
                  <div className="grid gap-2">
                    {question.shuffled.map((choice) => (
                      <label key={choice.index}
                        className={'flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 text-xs leading-5 ' +
                          (answers[question.id] === choice.index ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50')}>
                        <input type="radio" name={'lab04-question-' + question.id}
                          checked={answers[question.id] === choice.index}
                          onChange={() => { setAnswers((prev) => ({ ...prev, [question.id]: choice.index })); setFeedback(''); }}
                          className="mt-1" />
                        <span>{choice.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
              {feedback && <p role="status" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">{feedback}</p>}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3">
              <span className="text-xs text-slate-600">Attempts: {attempts} · Unlimited retries</span>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={retry}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                  <RefreshCw className="h-3.5 w-3.5"/> New questions
                </button>
                <button type="button" onClick={grade}
                  className="rounded-md bg-blue-700 px-4 py-2 text-xs font-semibold text-white">Check answers</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
