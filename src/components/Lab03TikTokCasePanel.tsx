import React, { useMemo, useState } from 'react';
import {
  Activity, ArrowRight, BadgeCheck, BookOpen, CalendarDays, CheckCircle2,
  ChevronRight, CircleDollarSign, Clock3, ExternalLink, FileVideo2, Heart,
  MessageCircle, Play, RotateCcw, ShieldCheck, Video, Wallet, XCircle,
} from 'lucide-react';
import type { ExecutionResult } from '../../lib/runners/types';

interface Props {
  result: ExecutionResult | null;
  onOpenCode: () => void;
}

type CampaignEvent = { id: string; day: number; type: string };
type Commitment = {
  id: string; debtor: string; creditor: string; when: string[];
  do: string; within: number; trigger_day: number | null;
  deadline_day: number | null; status: string;
};
type CaseResult = {
  events: CampaignEvent[]; ledger: Commitment[];
  offer_state: string; event_count: number; as_of_day: number;
};
const makeEvent = (id: string, day: number, type: string): CampaignEvent => ({ id, day, type });
const completed: CampaignEvent[] = [
  makeEvent('e01', 0, 'offer_sent'), makeEvent('e02', 0, 'offer_accepted'),
  makeEvent('e03', 1, 'escrow_funded'), makeEvent('e04', 4, 'video_submitted'),
  makeEvent('e05', 5, 'compliance_passed'), makeEvent('e06', 5, 'brand_reviewed'),
  makeEvent('e07', 5, 'brand_approved'), makeEvent('e08', 6, 'video_published'),
  makeEvent('e09', 8, 'payout_settled'),
];
const SCENARIOS: Array<{ id: string; title: string; brief: string; day: number; events: CampaignEvent[] }> = [
  { id: 'SUCCESS', title: 'Successful campaign', brief: 'Video accepted, published, and paid', day: 10, events: completed },
  { id: 'LATE_DELIVERY', title: 'Late submission', brief: 'Creator submits after the agreed deadline', day: 13,
    events: [...completed.slice(0, 3), makeEvent('l04', 8, 'video_submitted'), makeEvent('l05', 9, 'compliance_passed'), makeEvent('l06', 9, 'brand_reviewed'), makeEvent('l07', 9, 'brand_approved'), makeEvent('l08', 10, 'video_published'), makeEvent('l09', 12, 'payout_settled')] },
  { id: 'PAYOUT_MISSED', title: 'Payment missing', brief: 'The video is published, but payout never settles', day: 11, events: completed.slice(0, -1) },
  { id: 'WITHDRAWN_OFFER', title: 'Offer withdrawn', brief: 'The brand withdraws before creator acceptance', day: 12,
    events: [makeEvent('w01', 0, 'offer_sent'), makeEvent('w02', 1, 'offer_withdrawn')] },
  { id: 'COMPLIANCE_REJECTED', title: 'Compliance rejection', brief: 'The uploaded video does not pass review', day: 12,
    events: [...completed.slice(0, 4), makeEvent('r05', 5, 'compliance_failed'), makeEvent('r06', 5, 'brand_reviewed')] },
  { id: 'DUPLICATE_PAYOUT', title: 'Duplicate payment event', brief: 'The payment confirmation arrives twice with one ID', day: 10,
    events: [...completed, { ...completed[completed.length - 1] }] },
];
const RULES = [
  { id: 'K1', debtor: 'Brand', creditor: 'Creator', when: ['offer_accepted'], do: 'escrow_funded', within: 1 },
  { id: 'K2', debtor: 'Creator', creditor: 'Brand', when: ['offer_accepted', 'escrow_funded'], do: 'video_submitted', within: 5 },
  { id: 'K3', debtor: 'Brand', creditor: 'Creator', when: ['video_submitted'], do: 'brand_reviewed', within: 2 },
  { id: 'K4', debtor: 'Creator', creditor: 'Brand', when: ['brand_approved'], do: 'video_published', within: 2 },
  { id: 'K5', debtor: 'Payment Service', creditor: 'Creator', when: ['video_published'], do: 'payout_settled', within: 3 },
];
const EVENT_NAMES: Record<string, string> = {
  offer_sent: 'Brand sends offer',
  offer_accepted: 'Creator accepts',
  escrow_funded: 'Brand funds escrow',
  video_submitted: 'Creator submits video',
  compliance_passed: 'Compliance check passes',
  compliance_failed: 'Compliance check fails',
  brand_reviewed: 'Brand completes review',
  brand_approved: 'Brand approves video',
  video_published: 'Video goes live',
  payout_settled: 'Creator receives payout',
  offer_withdrawn: 'Brand withdraws offer',
  offer_declined: 'Creator declines offer',
};
const SOURCES = [
  { title: 'Creator marketing projects', url: 'https://ads.tiktok.com/help/article/how-to-create-a-new-creator-marketing-project-in-tiktok-one' },
  { title: 'Submitting videos and reviews', url: 'https://ads.tiktok.com/resources/help/article/how-creators-can-complete-deliverables-for-tiktok-one?lang=en' },
  { title: 'Creator invitations', url: 'https://ads.tiktok.com/resources/help/article/how-creators-can-find-and-join-tiktok-one-projects?lang=en-GB' },
];

function parsePythonCases(result: ExecutionResult | null): Record<string, CaseResult> | null {
  if (!result?.stdout) return null;
  const line = result.stdout.split(/\r?\n/).find((row) => row.startsWith('CASE_STATE='));
  if (!line) return null;
  try {
    const parsed: unknown = JSON.parse(line.slice('CASE_STATE='.length));
    return parsed && typeof parsed === 'object' ? parsed as Record<string, CaseResult> : null;
  } catch {
    return null;
  }
}

function StatusBadge({ value }: { value: string }) {
  const tone: Record<string, string> = {
    FULFILLED: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    VIOLATED: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
    ACTIVE: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    CONDITIONAL: 'border-slate-500/40 bg-slate-500/10 text-slate-300',
  };
  return <span className={'inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide ' + (tone[value] || tone.CONDITIONAL)}>{value}</span>;
}

function EarbudsArt() {
  return (
    <svg viewBox="0 0 270 250" role="img" aria-label="Illustration of NovaSound wireless earbuds" className="h-full w-full drop-shadow-2xl">
      <defs>
        <linearGradient id="podGradient" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" /><stop offset="0.5" stopColor="#b9d6e4" /><stop offset="1" stopColor="#5f8090" />
        </linearGradient>
        <linearGradient id="caseGradient" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#effaff" /><stop offset="1" stopColor="#618b9b" />
        </linearGradient>
      </defs>
      <ellipse cx="137" cy="225" rx="103" ry="16" fill="#020617" fillOpacity=".35" />
      <g transform="rotate(-22 88 90)">
        <rect x="64" y="37" width="40" height="71" rx="18" fill="url(#podGradient)" />
        <rect x="76" y="86" width="15" height="82" rx="7" fill="url(#podGradient)" />
        <ellipse cx="87" cy="59" rx="10" ry="14" fill="#283e4b" opacity=".88" />
      </g>
      <g transform="rotate(22 189 93)">
        <rect x="164" y="37" width="40" height="71" rx="18" fill="url(#podGradient)" />
        <rect x="176" y="86" width="15" height="82" rx="7" fill="url(#podGradient)" />
        <ellipse cx="187" cy="59" rx="10" ry="14" fill="#283e4b" opacity=".88" />
      </g>
      <rect x="69" y="160" width="134" height="64" rx="30" fill="url(#caseGradient)" stroke="#d8f5ff" strokeWidth="2" />
      <path d="M73 190 H198" stroke="#487686" strokeWidth="3" opacity=".7" />
      <circle cx="136" cy="202" r="3" fill="#20e2cf" />
    </svg>
  );
}

export const Lab03TikTokCasePanel: React.FC<Props> = ({ result, onOpenCode }) => {
  const [scenarioId, setScenarioId] = useState('SUCCESS');
  const [selectedRule, setSelectedRule] = useState('K2');
  const [selectedEvent, setSelectedEvent] = useState(0);
  const [detailsTab, setDetailsTab] = useState<'activity' | 'sources'>('activity');
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const cases = useMemo(() => parsePythonCases(result), [result]);
  const scenario = SCENARIOS.find((item) => item.id === scenarioId) || SCENARIOS[0];
  const pythonCase = cases?.[scenario.id];
  const ledger = pythonCase?.ledger || [];
  const activeRule = ledger.find((r) => r.id === selectedRule) || RULES.find((r) => r.id === selectedRule) || RULES[1];
  const uniqueCount = pythonCase?.event_count;
  const violations = ledger.filter((row) => row.status === 'VIOLATED').length;
  const fulfilled = ledger.filter((row) => row.status === 'FULFILLED').length;
  const chosenEvent = scenario.events[Math.min(selectedEvent, scenario.events.length - 1)];

  const chooseScenario = (id: string) => {
    setScenarioId(id);
    setSelectedEvent(0);
    setSelectedRule('K2');
  };

  return (
    <div className="h-full overflow-y-auto bg-[#080a0f] text-white">
      <div className="mx-auto max-w-[1720px] px-4 py-5 lg:px-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#12151d] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-2xl font-bold text-[#20d5ec]" style={{textShadow:'2px 1px #fe2c55'}}>♪</span>
            <div><div className="text-[15px] font-bold">TikTok Creator Campaign</div><div className="text-xs text-zinc-400">Social commitments and distributed agents</div></div>
            <span className="hidden rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold text-cyan-200 sm:inline-flex">CLASSROOM CASE</span>
          </div>
          <button type="button" onClick={onOpenCode} className="inline-flex items-center gap-2 rounded-lg bg-[#fe2c55] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#fa486c]">
            <Play className="h-3.5 w-3.5 fill-current" /> Open Python & Verify <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[198px_290px_minmax(305px,1fr)_300px] 2xl:grid-cols-[205px_330px_minmax(330px,1fr)_340px]">
          <aside className="rounded-2xl border border-white/10 bg-[#12151d] p-4">
            <div className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-400">Campaign scenarios</div>
            <div className="space-y-1.5">
              {SCENARIOS.map((item, index) => (
                <button type="button" key={item.id} onClick={() => chooseScenario(item.id)}
                  className={'w-full rounded-xl border px-3 py-3 text-left transition ' +
                    (scenario.id === item.id ? 'border-[#fe2c55]/60 bg-[#fe2c55]/15 text-white' : 'border-transparent bg-white/[0.03] text-zinc-300 hover:border-white/10 hover:bg-white/[0.07]')}>
                  <div className="flex items-center justify-between gap-1"><span className="text-xs font-bold">{index + 1}. {item.title}</span><ChevronRight className="h-3 w-3 shrink-0" /></div>
                  <div className="mt-1.5 text-[11px] leading-4 text-zinc-400">{item.brief}</div>
                </button>
              ))}
            </div>
            <div className="mt-5 border-t border-white/10 pt-4">
              <div className="text-xs font-bold">Project participants</div>
              {[['N','NovaSound','Brand'],['M','MayaTech','Creator'],['C','Review service','Compliance'],['P','Payout service','Payment']].map(([initial,name,role]) => (
                <div className="mt-3 flex items-center gap-2" key={role}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-zinc-800 text-xs font-bold">{initial}</span>
                  <div className="min-w-0"><div className="truncate text-xs font-semibold">{name}</div><div className="text-[10px] text-zinc-500">{role}</div></div>
                </div>
              ))}
            </div>
          </aside>

          <section className="overflow-hidden rounded-[26px] border-[5px] border-[#252936] bg-black shadow-2xl" aria-label="TikTok-style creator post preview">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs">
              <span className="font-semibold text-zinc-400">Following</span><span className="border-b-2 border-white pb-1 text-sm font-black">For You</span><span className="text-zinc-300"><Video className="h-4 w-4" /></span>
            </div>
            <div className="relative h-[460px] overflow-hidden bg-[#113344] sm:h-[510px]" style={{ backgroundImage: 'radial-gradient(circle at 50% 35%,#28566e 0%,#172c49 45%,#060b16 95%)' }}>
              <div className="absolute left-4 top-4 z-10 rounded-full bg-black/45 px-3 py-1 text-[10px] font-bold tracking-wider text-white">PAID PARTNERSHIP</div>
              <div className="absolute inset-x-2 top-[15%] h-[60%]"><EarbudsArt /></div>
              <div className="absolute left-6 top-[14%] max-w-[215px] text-3xl font-black leading-tight tracking-tight">MAKE EVERY BEAT COUNT.</div>
              <div className="absolute bottom-[70px] left-4 right-12 z-10">
                <div className="flex items-center gap-1.5 text-sm font-bold">@mayatech <BadgeCheck className="h-3.5 w-3.5 fill-cyan-500 text-white" /></div>
                <div className="mt-1 text-xs font-semibold">NovaSound AirPods concept • wireless audio</div>
                <div className="mt-1 text-[11px] text-white/80">#NovaSound #CreatorCollab #TechReview</div>
                <div className="mt-3 flex items-center gap-2 text-[11px] text-white/70"><span>♫</span><span className="truncate">Original classroom audio</span></div>
              </div>
              <div className="absolute bottom-[90px] right-3 z-10 flex flex-col items-center gap-4 text-white">
                <button type="button" onClick={() => setLiked((v)=>!v)} aria-label="Like preview" className="flex flex-col items-center gap-1"><Heart className={'h-7 w-7 ' + (liked ? 'fill-[#fe2c55] text-[#fe2c55]' : 'fill-white text-white')} /><span className="text-[10px]">{liked ? '1,285' : '1,284'}</span></button>
                <span className="flex flex-col items-center gap-1"><MessageCircle className="h-7 w-7 fill-white text-white/90" /><span className="text-[10px]">86</span></span>
                <button type="button" onClick={() => setSaved((v)=>!v)} aria-label="Save preview" className="flex flex-col items-center gap-1"><span className={'text-2xl leading-6 ' + (saved ? 'text-yellow-300' : 'text-white')}>★</span><span className="text-[10px]">{saved ? 'Saved' : 'Save'}</span></button>
              </div>
              <div className="absolute bottom-0 flex h-12 w-full items-center justify-around border-t border-white/15 bg-black/80 text-[10px] font-semibold">
                <span>⌂ Home</span><span>Explore</span><span className="rounded bg-white px-3 py-0.5 text-xl font-black leading-6 text-black" style={{boxShadow:'-3px 0 #20d5ec,3px 0 #fe2c55'}}>+</span><span>Inbox</span><span>Profile</span>
              </div>
            </div>
            <div className="border-t border-white/10 bg-[#0e1118] px-4 py-3 text-[11px] text-zinc-400">Creator feed mockup · No TikTok login or actual video</div>
          </section>

          <main className="min-w-0 space-y-4">
            <section className="rounded-2xl border border-white/10 bg-[#12151d] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2"><div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#20d5ec]">TikTok One • Creator marketing</div><span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold text-zinc-300">Day {scenario.day} review</span></div>
              <h1 className="mt-2 text-2xl font-black leading-tight">NovaSound x MayaTech</h1>
              <p className="mt-1 text-xs leading-5 text-zinc-400">One promotional video, brand approval, publication, and creator payout.</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-[#1b202b] p-3"><CircleDollarSign className="h-4 w-4 text-[#20d5ec]" /><div className="mt-2 text-lg font-black">RM 1,200</div><div className="text-[10px] text-zinc-400">Creator fee</div></div>
                <div className="rounded-xl bg-[#1b202b] p-3"><FileVideo2 className="h-4 w-4 text-[#fe2c55]" /><div className="mt-2 text-lg font-black">1 video</div><div className="text-[10px] text-zinc-400">Deliverable</div></div>
                <div className="rounded-xl bg-[#1b202b] p-3"><CalendarDays className="h-4 w-4 text-amber-400" /><div className="mt-2 text-lg font-black">{scenario.day}</div><div className="text-[10px] text-zinc-400">Evaluation day</div></div>
              </div>
              <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-3 text-[11px] leading-5 text-zinc-300"><span className="font-bold text-white">Project payment:</span> In the online-payment model, funding enters escrow before production. Payout follows publication. This case models both obligations separately.</div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#12151d] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><h2 className="text-sm font-bold">Campaign activity</h2><p className="mt-0.5 text-[11px] text-zinc-400">{scenario.title}</p></div>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setSelectedEvent(0)} title="First event" className="rounded-md border border-white/15 p-2 text-zinc-300 hover:bg-white/10"><RotateCcw className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => setSelectedEvent((v)=>Math.min(v+1,scenario.events.length-1))} title="Next event" className="rounded-md border border-white/15 p-2 text-zinc-300 hover:bg-white/10"><ChevronRight className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <div className="mt-4 max-h-[260px] space-y-1 overflow-y-auto pr-1">
                {scenario.events.map((item,index) => (
                  <button type="button" key={item.id + ':' + index} onClick={() => setSelectedEvent(index)}
                    className={'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ' + (index === selectedEvent ? 'bg-[#fe2c55]/15 ring-1 ring-[#fe2c55]/40' : 'hover:bg-white/5')}>
                    <span className={'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ' + (item.type.includes('failed') ? 'bg-rose-600/20 text-rose-300' : 'bg-cyan-500/10 text-cyan-200')}>D{item.day}</span>
                    <div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold">{EVENT_NAMES[item.type] || item.type}</div><div className="mt-0.5 text-[10px] text-zinc-500">Event {item.id}{scenario.id === 'DUPLICATE_PAYOUT' && index === scenario.events.length-1 ? ' · repeated ID' : ''}</div></div>
                    {index === selectedEvent ? <Activity className="h-4 w-4 text-[#fe2c55]" /> : null}
                  </button>
                ))}
              </div>
              <div className="mt-3 rounded-xl bg-[#222837] px-3 py-3 text-xs"><span className="font-semibold">Selected:</span> Day {chosenEvent.day}, {EVENT_NAMES[chosenEvent.type] || chosenEvent.type}<div className="mt-1 text-[10px] text-zinc-400">This event is part of the shared campaign history. Open the ledger to see its contractual consequence.</div></div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#12151d] p-5">
              <div className="flex gap-4 border-b border-white/10 text-xs font-bold">
                <button type="button" onClick={() => setDetailsTab('activity')} className={'pb-3 ' + (detailsTab==='activity' ? 'border-b-2 border-[#fe2c55] text-white' : 'text-zinc-500')}>Campaign rules</button>
                <button type="button" onClick={() => setDetailsTab('sources')} className={'pb-3 ' + (detailsTab==='sources' ? 'border-b-2 border-[#fe2c55] text-white' : 'text-zinc-500')}>TikTok sources</button>
              </div>
              {detailsTab === 'activity' ? (
                <div className="mt-4 text-xs leading-6 text-zinc-300">
                  <p><strong className="text-white">Offer:</strong> brand invites the creator. The creator may accept or decline.</p>
                  <p><strong className="text-white">Funding:</strong> the brand must deposit RM 1,200 within one day of acceptance.</p>
                  <p><strong className="text-white">Delivery:</strong> the creator has five days after acceptance and funding.</p>
                  <p><strong className="text-white">Review:</strong> brand review is due two days after submission.</p>
                  <p><strong className="text-white">Publication:</strong> the creator has two days after approval.</p>
                  <p><strong className="text-white">Payout:</strong> settlement is due three days after publication.</p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">{SOURCES.map((source) => <a key={source.url} target="_blank" rel="noreferrer" href={source.url} className="flex items-center justify-between gap-2 text-xs text-cyan-300 hover:text-cyan-100">{source.title}<ExternalLink className="h-3.5 w-3.5 shrink-0" /></a>)}</div>
              )}
            </section>
          </main>

          <aside className="min-w-0 space-y-4">
            <section className="rounded-2xl border border-white/10 bg-[#12151d] p-4">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-300" /><h2 className="text-sm font-bold">Commitment Ledger</h2></div>
              <p className="mt-1.5 text-[11px] leading-5 text-zinc-400">The Python engine evaluates obligations from the event history.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-[#1c222d] p-3"><div className="text-xl font-black text-emerald-300">{pythonCase ? fulfilled : '–'}</div><div className="text-[10px] text-zinc-400">Fulfilled</div></div>
                <div className="rounded-xl bg-[#1c222d] p-3"><div className="text-xl font-black text-rose-300">{pythonCase ? violations : '–'}</div><div className="text-[10px] text-zinc-400">Violated</div></div>
              </div>
              {!pythonCase && <div className="mt-3 rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-3 text-[11px] leading-5 text-amber-100">Open Python and run main.py to populate the ledger. The starter engine contains three bugs to fix.</div>}
              <div className="mt-3 space-y-2">
                {RULES.map((rule) => {
                  const actual = ledger.find((item) => item.id === rule.id);
                  return <button type="button" key={rule.id} onClick={() => setSelectedRule(rule.id)}
                    className={'w-full rounded-xl border p-3 text-left transition ' +
                      (selectedRule === rule.id ? 'border-[#20d5ec]/50 bg-[#20d5ec]/10' : 'border-white/10 bg-white/[0.025] hover:bg-white/[0.06]')}>
                    <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold">{rule.id} · {rule.debtor}</span><ChevronRight className="h-3.5 w-3.5 text-zinc-500" /></div>
                    <div className="my-1.5 text-[11px] text-zinc-400">{EVENT_NAMES[rule.do] || rule.do}</div>
                    {actual ? <StatusBadge value={actual.status} /> : <span className="text-[10px] text-zinc-500">Run Python for status</span>}
                  </button>;
                })}
              </div>
              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="text-xs font-bold">{activeRule.id}: {activeRule.debtor} → {activeRule.creditor}</div>
                <div className="mt-2 space-y-2 text-[11px] leading-5 text-zinc-300">
                  <div><span className="font-semibold text-white">Trigger:</span> {activeRule.when.map((v)=>EVENT_NAMES[v] || v).join(' AND ')}</div>
                  <div><span className="font-semibold text-white">Outcome:</span> {EVENT_NAMES[activeRule.do] || activeRule.do}</div>
                  <div><span className="font-semibold text-white">Time allowed:</span> {activeRule.within} day{activeRule.within!==1 ? 's' : ''} after trigger</div>
                  {pythonCase && 'trigger_day' in activeRule && <div><span className="font-semibold text-white">Activated:</span> {activeRule.trigger_day === null ? 'Not triggered' : 'Day ' + activeRule.trigger_day}</div>}
                  {pythonCase && 'deadline_day' in activeRule && <div><span className="font-semibold text-white">Deadline:</span> {activeRule.deadline_day === null ? 'Not set' : 'Day ' + activeRule.deadline_day}</div>}
                </div>
              </div>
              {pythonCase && <div className="mt-4 rounded-lg bg-[#1c222d] p-3 text-[11px] text-zinc-300"><span className="font-semibold text-white">Event count:</span> {uniqueCount} distinct event IDs. Compare with the visible timeline to inspect duplicates.</div>}
            </section>
            <section className="rounded-2xl border border-white/10 bg-[#12151d] p-4 text-xs leading-5 text-zinc-400">
              <div className="mb-1 flex items-center gap-2 font-semibold text-white"><BookOpen className="h-4 w-4" /> In your report</div>
              Pick one fulfilled, one violated, and one conditional commitment. Record the event and deadline that explain each result.
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};
