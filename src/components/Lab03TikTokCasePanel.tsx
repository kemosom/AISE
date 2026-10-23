import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, ArrowRight, BadgeCheck, BookOpen, CalendarDays, CheckCircle2,
  ChevronRight, CircleDollarSign, Clock3, ExternalLink, FileVideo2, Heart,
  MessageCircle, Play, RotateCcw, ShieldCheck, Video, Wallet, XCircle,
} from 'lucide-react';
import type { ExecutionResult } from '../../lib/runners/types';

interface Props {
  result: ExecutionResult | null;
  onOpenCode: () => void;
  onUpdatePolicy: (policyId: string, key: string, value: number) => void;
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
  { id: 'AGENT_NORMAL', title: 'Agents: normal delivery', brief: 'All four services generate events and settle on time', day: 20, events: [] },
  { id: 'AGENT_CREATOR_LATE', title: 'Agents: late creator', brief: 'Change the creator delivery policy and examine K2', day: 20, events: [] },
  { id: 'AGENT_PAYMENT_RETRY', title: 'Agents: payment retries', brief: 'Payout service retries requests before settlement', day: 20, events: [] },
  { id: 'AGENT_PAYMENT_OUTAGE', title: 'Agents: payment outage', brief: 'Repeated retries exceed the contract deadline', day: 20, events: [] },
  { id: 'AGENT_REJECTED', title: 'Agents: rejected video', brief: 'Compliance service refuses submitted content', day: 20, events: [] },
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
  payout_requested: 'Payment attempt sent',
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


const FEED_CLIPS = [
  {
    id: 'campaign', title: 'NovaSound wireless earbuds',
    user: 'mayatech', caption: 'When the client says the deadline is flexible… and then checks the SLA 😭',
    tag: '#NovaSound #CreatorCampaign', source: '', sourcePage: '', author: 'Lab 03 illustration', featured: true,
  },
  {
    id: 'cat-surprise', title: 'The surprise deployment',
    user: 'debuggingcat', caption: 'POV: the deadline alert finally reaches the creator service 🐈',
    tag: '#SoftwareEngineering #Jumpscare',
    source: 'https://upload.wikimedia.org/wikipedia/commons/0/07/Cat_Jumpscare.webm',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Cat_Jumpscare.webm', author: 'Panini! · CC0', featured: false,
  },
  {
    id: 'husky', title: 'The payment-service outage',
    user: 'huskysupport', caption: 'The payment agent after its third retry fails.',
    tag: '#DistributedSystems #IncidentResponse',
    source: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Howling_Husky_Dog.webm',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Howling_Husky_Dog.webm', author: 'Klaudya Teodora · CC0', featured: false,
  },
  {
    id: 'moomin', title: 'Regression test at 2 AM',
    user: 'moomin.qa', caption: 'Trying the same test again because it passed on my laptop.',
    tag: '#QA #Programming',
    source: 'https://upload.wikimedia.org/wikipedia/commons/c/c6/Moomin1.webm',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Moomin1.webm', author: 'Tet · CC0', featured: false,
  },
  {
    id: 'oreo', title: 'The rejected pull request',
    user: 'oreo.engineer', caption: 'When compliance sends the same rejection again.',
    tag: '#CodeReview #NoMoreRetries',
    source: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Miss_Oreo_%28O-Dog%29.webm',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Miss_Oreo_(O-Dog).webm', author: 'Fancibaer · CC0', featured: false,
  },
];

function TikTokVideoFeed() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Record<string, string[]>>({});
  const [failedVideos, setFailedVideos] = useState<string[]>([]);
  const [playing, setPlaying] = useState(true);
  const [shareStatus, setShareStatus] = useState('');
  const clip = FEED_CLIPS[active];

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      video.muted = muted;
      if (index === active && playing) {
        void video.play().catch(() => setPlaying(false));
      } else {
        video.pause();
      }
    });
  }, [active, muted, playing]);

  const navigate = (index: number) => {
    const next = Math.max(0, Math.min(FEED_CLIPS.length - 1, index));
    const viewport = scrollRef.current;
    if (viewport) viewport.scrollTo({ top: next * viewport.clientHeight, behavior: 'smooth' });
    setActive(next);
    setPlaying(true);
    setCommentsOpen(false);
  };

  const onScroll = () => {
    const viewport = scrollRef.current;
    if (!viewport) return;
    const index = Math.max(0, Math.min(FEED_CLIPS.length - 1, Math.round(viewport.scrollTop / viewport.clientHeight)));
    if (index !== active) {
      setActive(index);
      setPlaying(true);
      setCommentsOpen(false);
      setShareStatus('');
    }
  };

  const addComment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = comment.trim();
    if (!value) return;
    setComments((old) => ({ ...old, [clip.id]: [...(old[clip.id] || []), value] }));
    setComment('');
  };

  const shareClip = async () => {
    try {
      await navigator.clipboard.writeText(clip.sourcePage || window.location.href);
      setShareStatus('Link copied');
    } catch {
      setShareStatus('Link not available');
    }
  };

  return (
    <section className="min-w-0 overflow-hidden rounded-[28px] border-[5px] border-[#292d37] bg-black shadow-2xl" aria-label="Interactive short-video feed">
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-center gap-5 bg-gradient-to-b from-black/80 to-transparent px-3 pb-8 pt-4 text-sm font-semibold">
          <span className="text-white/60">Following</span><span className="border-b-2 border-white pb-1">For You</span>
        </div>
        <div ref={scrollRef} onScroll={onScroll} onKeyDown={(e) => { if (e.key === 'ArrowDown') navigate(active + 1); if (e.key === 'ArrowUp') navigate(active - 1); }}
          tabIndex={0} aria-label="Scroll through short videos. Use arrow keys to navigate."
          className="h-[550px] snap-y snap-mandatory overflow-y-auto overscroll-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FEED_CLIPS.map((item, index) => (
            <article key={item.id} className="relative h-[550px] w-full snap-start overflow-hidden bg-[#0e1725]">
              {item.featured ? (
                <div className="absolute inset-0" style={{background:'radial-gradient(circle at 50% 30%, #277087 0%, #143d54 40%, #050a13 92%)'}}>
                  <div className="absolute left-5 top-[20%] z-10 max-w-[215px] text-2xl font-black leading-tight">MAKE EVERY BEAT COUNT.</div>
                  <div className="absolute inset-x-0 top-[26%] h-[57%]"><EarbudsArt /></div>
                  <div className="absolute left-4 top-[12%] z-10 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold">FICTIONAL CAMPAIGN PREVIEW</div>
                </div>
              ) : (
                <>
                  <video
                    ref={(node) => { videoRefs.current[index] = node; }}
                    src={item.source}
                    autoPlay={index === active} muted={muted} loop playsInline preload={index === active ? 'metadata' : 'none'}
                    onError={() => setFailedVideos((old) => old.includes(item.id) ? old : [...old, item.id])}
                    className="absolute inset-0 h-full w-full object-cover"
                    aria-label={item.title}
                  />
                  {failedVideos.includes(item.id) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-slate-700 to-zinc-950 p-6 text-center">
                      <Video className="h-10 w-10 text-zinc-400" />
                      <p className="text-xs leading-5 text-zinc-200">This video could not load from Wikimedia Commons.</p>
                      <a className="text-xs font-semibold text-cyan-300 underline" href={item.sourcePage} target="_blank" rel="noreferrer">Open licensed video source</a>
                    </div>
                  )}
                </>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />
              <div className="absolute bottom-[62px] left-4 right-14 z-10">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">@{item.user}</span>
                  {!item.featured && <button type="button" onClick={() => setFollowing((old) => old.includes(item.user) ? old.filter((x) => x !== item.user) : [...old, item.user])}
                    className={'rounded border px-2 py-0.5 text-[10px] font-bold ' + (following.includes(item.user) ? 'border-white/40 bg-white/20' : 'border-[#fe2c55] bg-[#fe2c55]')}>{following.includes(item.user) ? 'Following' : 'Follow +'}</button>}
                </div>
                <p className="mt-1.5 text-xs font-semibold leading-5">{item.caption}</p>
                <p className="mt-1 text-[11px] text-cyan-200">{item.tag}</p>
                {item.sourcePage && <a href={item.sourcePage} target="_blank" rel="noreferrer" className="mt-2 inline-flex max-w-full items-center gap-1 truncate text-[10px] text-white/70 underline">{item.author} <ExternalLink className="h-3 w-3 shrink-0" /></a>}
                {shareStatus && <p className="mt-2 text-[11px] text-emerald-300">{shareStatus}</p>}
              </div>
              <div className="absolute bottom-[87px] right-3 z-10 flex flex-col items-center gap-4 text-white">
                <button type="button" title="Like clip" aria-label="Like clip" onClick={() => setLiked((old)=>old.includes(item.id)?old.filter((x)=>x!==item.id):[...old,item.id])} className="flex flex-col items-center">
                  <Heart className={'h-7 w-7 ' + (liked.includes(item.id) ? 'fill-[#fe2c55] text-[#fe2c55]' : 'fill-white')} /><span className="mt-1 text-[10px]">{liked.includes(item.id) ? '1,285' : '1,284'}</span>
                </button>
                <button type="button" title="Comments" aria-label="Comments" onClick={() => setCommentsOpen(true)} className="flex flex-col items-center">
                  <MessageCircle className="h-7 w-7 fill-white" /><span className="mt-1 text-[10px]">{86 + (comments[item.id]?.length || 0)}</span>
                </button>
                <button type="button" title="Copy source link" aria-label="Share clip" onClick={() => void shareClip()} className="flex flex-col items-center">
                  <ArrowRight className="h-7 w-7" /><span className="mt-1 text-[10px]">Share</span>
                </button>
                <button type="button" title="Toggle sound" aria-label="Toggle sound" onClick={() => setMuted((v)=>!v)} className="rounded-full bg-black/35 p-2 text-[10px] font-bold">{muted ? 'Muted' : 'Sound'}</button>
              </div>
              {!item.featured && <button type="button" aria-label={playing ? 'Pause video' : 'Play video'} onClick={() => setPlaying((v)=>!v)} className="absolute left-[42%] top-[45%] z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/20 text-white/65 hover:bg-black/50">
                {!playing && <Play className="h-7 w-7 fill-current" />}
              </button>}
              {commentsOpen && index === active && <div className="absolute bottom-0 left-0 right-0 z-30 flex max-h-[63%] flex-col rounded-t-2xl bg-[#171a22] p-4 shadow-2xl">
                <div className="flex items-center justify-between text-sm font-semibold"><span>Comments</span><button type="button" aria-label="Close comments" onClick={() => setCommentsOpen(false)}><XCircle className="h-5 w-5" /></button></div>
                <div className="my-4 flex-1 space-y-3 overflow-y-auto text-xs text-zinc-300">
                  <p><strong>@softwaredev</strong> Please tell the payment service to retry.</p>
                  <p><strong>@tester</strong> Works on my machine is not a test result.</p>
                  {(comments[item.id] || []).map((message,i)=><p key={i}><strong>@you</strong> {message}</p>)}
                </div>
                <form onSubmit={addComment} className="flex gap-2"><input value={comment} onChange={(e)=>setComment(e.target.value)} placeholder="Add a comment" className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-xs text-white" /><button type="submit" className="rounded-lg bg-[#fe2c55] px-3 text-xs font-semibold">Post</button></form>
              </div>}
            </article>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex h-[46px] items-center justify-around border-t border-white/15 bg-black/85 text-[10px] font-semibold">
          <span>Home</span><span>Friends</span><span className="rounded bg-white px-3 py-0.5 text-xl font-black leading-6 text-black" style={{boxShadow:'-3px 0 #20d5ec,3px 0 #fe2c55'}}>+</span><span>Inbox</span><span>Profile</span>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-white/10 bg-[#0f131b] px-3 py-2">
        <button type="button" onClick={() => navigate(active - 1)} disabled={active===0} className="rounded border border-white/15 px-2 py-1.5 text-[11px] disabled:opacity-30">Previous</button>
        <span className="text-[10px] text-zinc-400">Swipe or scroll · {active+1}/{FEED_CLIPS.length}</span>
        <button type="button" onClick={() => navigate(active + 1)} disabled={active===FEED_CLIPS.length-1} className="rounded border border-white/15 px-2 py-1.5 text-[11px] disabled:opacity-30">Next ↓</button>
      </div>
      <p className="border-t border-white/10 px-3 py-2 text-[10px] leading-4 text-zinc-500">Demonstration feed with licensed Wikimedia Commons videos. Likes, follows, and comments are local only.</p>
    </section>
  );
}

export const Lab03TikTokCasePanel: React.FC<Props> = ({ result, onOpenCode, onUpdatePolicy }) => {
  const [scenarioId, setScenarioId] = useState('SUCCESS');
  const [selectedRule, setSelectedRule] = useState('K2');
  const [selectedEvent, setSelectedEvent] = useState(0);
  const [detailsTab, setDetailsTab] = useState<'activity' | 'sources'>('activity');
  const [deliveryDelay, setDeliveryDelay] = useState(8);
  const [paymentFailures, setPaymentFailures] = useState(2);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const cases = useMemo(() => parsePythonCases(result), [result]);
  const scenario = SCENARIOS.find((item) => item.id === scenarioId) || SCENARIOS[0];
  const pythonCase = cases?.[scenario.id];
  const ledger = pythonCase?.ledger || [];
  const activeRule = ledger.find((r) => r.id === selectedRule) || RULES.find((r) => r.id === selectedRule) || RULES[1];
  const uniqueCount = pythonCase?.event_count;
  const visibleEvents = pythonCase?.events || scenario.events;
  const isAgentExperiment = scenario.id.startsWith('AGENT_');
  const violations = ledger.filter((row) => row.status === 'VIOLATED').length;
  const fulfilled = ledger.filter((row) => row.status === 'FULFILLED').length;
  const chosenEvent = visibleEvents[Math.min(selectedEvent, visibleEvents.length - 1)] || null;

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
                <React.Fragment key={item.id}>
                {index === 6 && <div className="mb-2 mt-5 border-t border-white/15 pt-4 text-[11px] font-bold uppercase tracking-wider text-cyan-200">Agent experiments</div>}
                <button type="button" key={item.id} onClick={() => chooseScenario(item.id)}
                  className={'w-full rounded-xl border px-3 py-3 text-left transition ' +
                    (scenario.id === item.id ? 'border-[#fe2c55]/60 bg-[#fe2c55]/15 text-white' : 'border-transparent bg-white/[0.03] text-zinc-300 hover:border-white/10 hover:bg-white/[0.07]')}>
                  <div className="flex items-center justify-between gap-1"><span className="text-xs font-bold">{index < 6 ? (index + 1) + '. ' : ''}{item.title}</span><ChevronRight className="h-3 w-3 shrink-0" /></div>
                  <div className="mt-1.5 text-[11px] leading-4 text-zinc-400">{item.brief}</div>
                </button>
                </React.Fragment>
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

          <TikTokVideoFeed />

          <main className="min-w-0 space-y-4">
            <section className="rounded-2xl border border-white/10 bg-[#12151d] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2"><div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#20d5ec]">TikTok One • Creator marketing</div><span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold text-zinc-300">Day {pythonCase?.as_of_day ?? scenario.day} review</span></div>
              <h1 className="mt-2 text-2xl font-black leading-tight">NovaSound x MayaTech</h1>
              <p className="mt-1 text-xs leading-5 text-zinc-400">One promotional video, brand approval, publication, and creator payout.</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-[#1b202b] p-3"><CircleDollarSign className="h-4 w-4 text-[#20d5ec]" /><div className="mt-2 text-lg font-black">RM 1,200</div><div className="text-[10px] text-zinc-400">Creator fee</div></div>
                <div className="rounded-xl bg-[#1b202b] p-3"><FileVideo2 className="h-4 w-4 text-[#fe2c55]" /><div className="mt-2 text-lg font-black">1 video</div><div className="text-[10px] text-zinc-400">Deliverable</div></div>
                <div className="rounded-xl bg-[#1b202b] p-3"><CalendarDays className="h-4 w-4 text-amber-400" /><div className="mt-2 text-lg font-black">{pythonCase?.as_of_day ?? scenario.day}</div><div className="text-[10px] text-zinc-400">Evaluation day</div></div>
              </div>
              <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-3 text-[11px] leading-5 text-zinc-300"><span className="font-bold text-white">Project payment:</span> In the online-payment model, funding enters escrow before production. Payout follows publication. This case models both obligations separately.</div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#12151d] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><h2 className="text-sm font-bold">Campaign activity</h2><p className="mt-0.5 text-[11px] text-zinc-400">{scenario.title}</p></div>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setSelectedEvent(0)} title="First event" className="rounded-md border border-white/15 p-2 text-zinc-300 hover:bg-white/10"><RotateCcw className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => setSelectedEvent((v)=>Math.min(v+1,Math.max(0,visibleEvents.length-1)))} title="Next event" className="rounded-md border border-white/15 p-2 text-zinc-300 hover:bg-white/10"><ChevronRight className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              {isAgentExperiment && !pythonCase && <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-[11px] text-amber-100">Run main.py first. This timeline is generated by Python agents, not predetermined events.</div>}
              <div className="mt-4 max-h-[260px] space-y-1 overflow-y-auto pr-1">
                {visibleEvents.map((item,index) => (
                  <button type="button" key={item.id + ':' + index} onClick={() => setSelectedEvent(index)}
                    className={'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ' + (index === selectedEvent ? 'bg-[#fe2c55]/15 ring-1 ring-[#fe2c55]/40' : 'hover:bg-white/5')}>
                    <span className={'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ' + (item.type.includes('failed') ? 'bg-rose-600/20 text-rose-300' : 'bg-cyan-500/10 text-cyan-200')}>D{item.day}</span>
                    <div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold">{EVENT_NAMES[item.type] || item.type}</div><div className="mt-0.5 text-[10px] text-zinc-500">Event {item.id}{scenario.id === 'DUPLICATE_PAYOUT' && index === visibleEvents.length-1 ? ' · repeated ID' : ''}</div></div>
                    {index === selectedEvent ? <Activity className="h-4 w-4 text-[#fe2c55]" /> : null}
                  </button>
                ))}
              </div>
              {chosenEvent && <div className="mt-3 rounded-xl bg-[#222837] px-3 py-3 text-xs"><span className="font-semibold">Selected:</span> Day {chosenEvent.day}, {EVENT_NAMES[chosenEvent.type] || chosenEvent.type}<div className="mt-1 text-[10px] text-zinc-400">This event is part of the campaign history. The ledger determines whether its obligation was met.</div></div>}
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
            {isAgentExperiment && (
              <section className="rounded-2xl border border-cyan-400/20 bg-[#121b25] p-4">
                <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-cyan-300" /><h2 className="text-sm font-bold">Fault injection</h2></div>
                <p className="mt-2 text-[11px] leading-5 text-zinc-400">Change an agent policy in the real Python source. Run Python to generate a new event history and ledger.</p>
                {(scenarioId === 'AGENT_CREATOR_LATE' || scenarioId === 'AGENT_NORMAL') && (
                  <div className="mt-4">
                    <label htmlFor="l3-delivery-delay" className="flex justify-between text-[11px] font-semibold"><span>Creator delivery delay</span><span className="text-cyan-300">{deliveryDelay} days</span></label>
                    <input id="l3-delivery-delay" type="range" min="1" max="10" value={deliveryDelay}
                      onChange={(event)=>setDeliveryDelay(Number(event.target.value))} className="mt-3 w-full accent-[#fe2c55]" />
                    <button type="button" onClick={() => onUpdatePolicy(scenarioId, 'delivery_delay', deliveryDelay)}
                      className="mt-3 w-full rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-[11px] font-semibold text-cyan-100 hover:bg-cyan-400/20">
                      Apply to Python, then Run
                    </button>
                  </div>
                )}
                {(scenarioId === 'AGENT_PAYMENT_RETRY' || scenarioId === 'AGENT_PAYMENT_OUTAGE') && (
                  <div className="mt-4">
                    <label htmlFor="l3-payment-failures" className="flex justify-between text-[11px] font-semibold"><span>Failed payment attempts</span><span className="text-cyan-300">{paymentFailures}</span></label>
                    <input id="l3-payment-failures" type="range" min="0" max="6" value={paymentFailures}
                      onChange={(event)=>setPaymentFailures(Number(event.target.value))} className="mt-3 w-full accent-[#fe2c55]" />
                    <button type="button" onClick={() => onUpdatePolicy(scenarioId, 'payment_failures', paymentFailures)}
                      className="mt-3 w-full rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-[11px] font-semibold text-cyan-100 hover:bg-cyan-400/20">
                      Apply to Python, then Run
                    </button>
                  </div>
                )}
                <div className="mt-3 text-[10px] leading-4 text-zinc-500">The ledger will update only after Python executes. Restore the starting values before verification.</div>
              </section>
            )}
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
