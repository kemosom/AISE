import React, { useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, LockKeyhole, X } from 'lucide-react';
import questionBanks from '../../labs/lab04-software-repair-agents/hint-questions.json';

type Question = { id: string; question: string; options: string[]; correct: number };
type Presented = Question & { shuffled: Array<{ index: number; label: string }> };
type Props = { exerciseId: string; source: string; onInsert: (code: string) => void };
type ReviewedAnswer = { question: string; selected: string; correct: string; isCorrect: boolean };
type Review = { correctCount: number; items: ReviewedAnswer[] };

const shuffle = <T,>(items: T[]): T[] => {
  const output = [...items];
  for (let i = output.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [output[i], output[j]] = [output[j], output[i]];
  }
  return output;
};
function drawQuestions(exerciseId: string, previous: Presented[] = []): Presented[] {
  const banks = questionBanks as Record<string, Question[]>;
  const pool = banks[exerciseId] || [];
  const selection = shuffle(pool).slice(0, 3);
  // Guarantee at least one different question on each retry.
  if (previous.length && selection.length === previous.length &&
    selection.every((q) => previous.some((old) => old.id === q.id))) {
    const replacement = shuffle(pool.filter((q) => !selection.some((selected) => selected.id === q.id)))[0];
    if (replacement) selection[0] = replacement;
  }
  return selection.map((q) => ({
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
  const [review, setReview] = useState<Review | null>(null);
  const questionAreaRef = useRef<HTMLDivElement>(null);
  const [attempts, setAttempts] = useState(0);

  const start = () => {
    setQuestions(drawQuestions(exerciseId, questions));
    setAnswers({});
    setFeedback('');
    setReview(null);
    setOpen(true);
  };
  const grade = () => {
    if (questions.some((question) => answers[question.id] === undefined)) {
      setFeedback('Select one answer for each of the three questions before submitting.');
      return;
    }
    const items: ReviewedAnswer[] = questions.map((question) => ({
      question: question.question,
      selected: question.options[answers[question.id]],
      correct: question.options[question.correct],
      isCorrect: answers[question.id] === question.correct,
    }));
    const correctCount = items.filter((item) => item.isCorrect).length;
    setAttempts((previous) => previous + 1);
    if (correctCount === 3) {
      setUnlocked(true);
      setOpen(false);
      setFeedback('');
      setReview(null);
      return;
    }
    // Immediately present new questions but retain an answer-by-answer
    // review of the previous submission above them.
    setReview({ correctCount, items });
    setQuestions(drawQuestions(exerciseId, questions));
    setAnswers({});
    setFeedback('');
    // Show the review immediately, even when the student submitted
    // from the bottom of the scrollable question list.
    questionAreaRef.current?.scrollTo({ top: 0, behavior: 'instant' });
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
                <p className="mt-1 text-xs leading-5 text-slate-600">Choose one answer for each question and submit. You will see which selections were correct. If needed, the next three questions appear automatically. There is no attempt limit.</p>
              </div>
              <button aria-label="Close checkpoint" type="button" onClick={() => setOpen(false)} className="rounded-md p-1 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5"/></button>
            </div>
            <div ref={questionAreaRef} className="max-h-[min(65vh,590px)] space-y-5 overflow-y-auto px-5 py-4">
              {review && (
                <section aria-label="Feedback on previous answers" className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <h5 className="text-sm font-semibold text-slate-900">
                    Previous attempt: {review.correctCount} of 3 correct
                  </h5>
                  <p className="mt-1 text-xs text-slate-600">
                    Review your selected answers below. A new set of three questions is ready underneath.
                  </p>
                  <div className="mt-3 space-y-2">
                    {review.items.map((item, index) => (
                      <div key={index}
                        className={'rounded-md border bg-white p-3 text-xs leading-5 ' +
                          (item.isCorrect ? 'border-emerald-200' : 'border-rose-200')}>
                        <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
                          <span className="font-semibold text-slate-800">{index + 1}. {item.question}</span>
                          <span className={'shrink-0 font-semibold ' +
                            (item.isCorrect ? 'text-emerald-700' : 'text-rose-700')}>
                            {item.isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>
                        <p className="text-slate-700">Your answer: {item.selected}</p>
                        {!item.isCorrect && <p className="mt-1 font-medium text-emerald-800">Correct answer: {item.correct}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}
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
              <button type="button" onClick={grade}
                className="rounded-md bg-blue-700 px-4 py-2 text-xs font-semibold text-white">
                Submit answers
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
