import React, { useEffect, useState } from 'react';
import { Bot, Copy, ExternalLink, Send, ShieldCheck } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; content: string };
type Status = { configured: boolean; studentEnabled: boolean; model: string | null };

const prompts = [
  {
    label: 'Audit FR-06',
    value: 'Review FR-06 against Spotify D1/D2. Explain the exact conflicting attributes and suggest a testable replacement requirement with acceptance criteria.',
  },
  {
    label: 'Propose a release',
    value: 'Prioritize all six requirements for 8 engineer-days. Use stakeholder utility, effort and dependencies. Return ranked_ids, infeasible_ids, release_ids, total_engineer_days, and citations in JSON. Flag uncertain facts.',
  },
  {
    label: 'Challenge the ranking',
    value: 'Critically assess whether the stakeholder weights and fictional engineer-day estimates are sufficient evidence for a real product release. What should a requirements engineer validate?',
  },
];

interface Props {
  instructorChatToken?: string | null;
}

export const Lab02AIAssistant: React.FC<Props> = ({ instructorChatToken }) => {
  const [status, setStatus] = useState<Status | null>(null);
  const [statusError, setStatusError] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [billingBlocked, setBillingBlocked] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch('/api/lab02-chat', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to check LLM status.');
        return await response.json();
      })
      .then((s) => { if (mounted) setStatus(s); })
      .catch(() => {
        if (mounted) setStatusError('The AI service is currently unavailable.');
      });
    return () => { mounted = false; };
  }, []);

  const send = async () => {
    const question = draft.trim();
    if (!question || sending || !status?.configured) return;
    const updated: Message[] = [...messages, { role: 'user', content: question }];
    setMessages(updated);
    setDraft('');
    setError('');
    setBillingBlocked(false);
    setSending(true);

    try {
      const response = await fetch('/api/lab02-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(instructorChatToken ? { 'X-AISE-Instructor-Chat': instructorChatToken } : {}),
        },
        body: JSON.stringify({ messages: updated.slice(-9) }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 402) setBillingBlocked(true);
        throw new Error(payload.error || 'The language model did not return a response.');
      }
      if (typeof payload.answer !== 'string') throw new Error('Invalid model response.');
      setMessages((previous) => [...previous, { role: 'assistant', content: payload.answer }]);
    } catch (err: any) {
      setError(err.message || 'The model request failed.');
      // Preserve question so the student may retry, without duplicating it.
      setMessages((previous) => previous.slice(0, -1));
      setDraft(question);
    } finally {
      setSending(false);
    }
  };

  const modelReady = Boolean(status?.configured &&
    (status.studentEnabled || instructorChatToken));

  return (
    <div className="h-full overflow-y-auto bg-slate-50 px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
            <Bot className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold text-slate-950">AI Requirements Assistant</h2>
            <p className="mt-1 text-sm text-slate-600">
              Real open-weight LLM via Hugging Face Inference Providers, not a rule-based chatbot.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs leading-6 text-slate-600">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <ShieldCheck className="h-4 w-4" />
            Evidence-grounded software engineering exercise
          </div>
          <p className="mt-1">
            The assistant receives short, course-supplied excerpts from Spotify D1 and D2
            and the six fictional feature requests. It does not browse Spotify live,
            train on your code, or independently verify its claims. Check the linked
            source yourself before accepting its recommendation.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <a className="inline-flex items-center gap-1 text-blue-800 underline"
              href="https://developer.spotify.com/documentation/web-api/concepts/playlists"
              target="_blank" rel="noreferrer">D1: Spotify Playlists <ExternalLink className="h-3 w-3" /></a>
            <a className="inline-flex items-center gap-1 text-blue-800 underline"
              href="https://developer.spotify.com/documentation/web-api/reference/change-playlist-details"
              target="_blank" rel="noreferrer">D2: Change Details <ExternalLink className="h-3 w-3" /></a>
          </div>
          <p className="mt-2">Do not enter student IDs, personal information, passwords, or API credentials.
            Messages are sent to Hugging Face and its selected inference provider.</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-800">
              {status?.configured
                ? 'Model: ' + status.model
                : statusError || 'Model not yet configured'}
            </span>
            <button type="button" onClick={() => { setMessages([]); setError(''); setBillingBlocked(false); }}
              className="rounded border border-slate-200 px-2 py-1 text-slate-600 hover:bg-slate-50">
              Clear conversation
            </button>
          </div>

          {!status?.configured && (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-900">
              {statusError || 'Waiting for an instructor to configure HF_TOKEN as a server-side Vercel environment variable. No simulated answers are shown.'}
              <p className="mt-1">
                The lab's Python, tests, and report work independently of this service.
              </p>
            </div>
          )}
          {status?.configured && !modelReady && (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              This assistant is restricted to instructors until Lab 02 is released.
            </div>
          )}

          <div aria-live="polite" className="max-h-[330px] min-h-[160px] space-y-3 overflow-y-auto rounded-md bg-slate-50 p-3">
            {messages.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-500">
                Start with one of the questions below or write your own.
                Treat the answer as a proposal to verify, not as the correct solution.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'ml-8' : 'mr-8'}>
                <div className={'rounded-lg border p-3 text-sm leading-6 whitespace-pre-wrap break-words ' +
                  (m.role === 'user'
                    ? 'border-blue-200 bg-blue-50 text-slate-900'
                    : 'border-slate-200 bg-white text-slate-800')}>
                  <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <span>{m.role === 'user' ? 'Student' : 'Hugging Face model'}</span>
                    <button type="button" onClick={() => void navigator.clipboard.writeText(m.content)}
                      title="Copy message" aria-label="Copy message"
                      className="rounded p-1 hover:bg-slate-100">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {m.content}
                </div>
              </div>
            ))}
            {sending && <p className="text-xs text-slate-500">Contacting model...</p>}
          </div>

          {error && (
            <div role="alert" className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-xs leading-6 text-red-800">
              <p>{error}</p>
              {billingBlocked && (
                <p className="mt-2">
                  <a href="https://huggingface.co/settings/billing" target="_blank" rel="noreferrer"
                    className="font-semibold underline">Review Hugging Face billing and credits</a>
                  {' '}using the account that created the HF_TOKEN stored in Vercel.
                  Changing the model does not restore exhausted account credits.
                </p>
              )}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {prompts.map((p) => (
              <button key={p.label} type="button" onClick={() => setDraft(p.value)}
                disabled={sending}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                {p.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-end gap-2">
            <textarea
              aria-label="Ask the AI requirements assistant"
              rows={3}
              maxLength={1600}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="Ask about FR-06, feature prioritization, source evidence, acceptance criteria..."
              className="min-h-[72px] flex-1 resize-y rounded-md border border-slate-300 p-3 text-sm leading-5 outline-none focus:border-blue-800"
            />
            <button type="button" onClick={() => void send()}
              disabled={!draft.trim() || sending || !modelReady}
              className="flex items-center gap-2 rounded-md bg-blue-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
              <Send className="h-4 w-4" /> Send
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Copy the model's ranked IDs into AI_SUGGESTED_ORDER in Code, then run and verify.
            The deterministic Python checks, not the LLM, enforce release constraints.
          </p>
        </div>
      </div>
    </div>
  );
};
