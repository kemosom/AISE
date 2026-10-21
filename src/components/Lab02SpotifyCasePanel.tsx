import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, BookOpen, CheckCircle2, ClipboardCopy, ExternalLink,
  FileText, Heart, Library, Lock, Music2, Pause, Play, Plus, Save,
  ShieldCheck, SkipForward, Trash2, Users, Volume2, X,
} from 'lucide-react';
import type { ExecutionResult } from '../../lib/runners/types';

type ReleaseResult = {
  budget: number;
  days_used: number;
  selected_ids: string[];
  policy_enforced: boolean;
  utility_example: number;
  total_utility: number;
};

type Source = { id: string; label: string; url: string; summary: string; verify: string };
const SOURCES: Source[] = [
  {
    id: 'D1', label: 'Playlists: concepts',
    url: 'https://developer.spotify.com/documentation/web-api/concepts/playlists',
    summary: 'A playlist can be public or collaborative, but not both at the same time. Public status is not an access-control mechanism. Snapshot IDs identify versions.',
    verify: 'Try public + collaborative together, then compare the simulator against the documented rule.',
  },
  {
    id: 'D2', label: 'Change playlist details',
    url: 'https://developer.spotify.com/documentation/web-api/reference/change-playlist-details',
    summary: 'Playlist detail changes require the correct authorization. The documented public and collaborative settings have a compatibility constraint.',
    verify: 'Change the playlist title, then identify what authorization a real API client would require.',
  },
  {
    id: 'D3', label: 'Add playlist items',
    url: 'https://developer.spotify.com/documentation/web-api/reference/add-items-to-playlist',
    summary: 'The Web API specifies operations for adding items to playlists; this classroom simulator does not send API calls.',
    verify: 'Add a sample track, then write a functional requirement and measurable acceptance criterion.',
  },
  {
    id: 'D4', label: 'Remove playlist items',
    url: 'https://developer.spotify.com/documentation/web-api/reference/remove-items-playlist',
    summary: 'The Web API supports removing playlist items; playlist snapshots are relevant to version-sensitive updates.',
    verify: 'Remove an item and discuss why your application should handle concurrent changes.',
  },
];

const CANDIDATES = [
  { id: 'FR-01', title: 'Edit playlist metadata', days: 2, doc: 'D2' },
  { id: 'FR-02', title: 'Publish a playlist', days: 2, doc: 'D1' },
  { id: 'FR-03', title: 'Collaborative playlist', days: 4, doc: 'D1' },
  { id: 'FR-04', title: 'Add a playlist item', days: 2, doc: 'D3' },
  { id: 'FR-05', title: 'Remove a playlist item', days: 4, doc: 'D4' },
  { id: 'FR-06', title: 'Public AND collaborative', days: 2, doc: 'D1', invalid: true },
];

const INITIAL_TRACKS = [
  { id: 1, name: 'Neon Skyline', artist: 'AISE Sessions', seconds: 152, frequency: 261.63 },
  { id: 2, name: 'Night Drive', artist: 'Studio One', seconds: 170, frequency: 329.63 },
  { id: 3, name: 'Focus Flow', artist: 'Lab Audio', seconds: 181, frequency: 392 },
];
const EXTRA_TRACKS = [
  { id: 4, name: 'Sunset Loop', artist: 'North Avenue', seconds: 163, frequency: 293.66 },
  { id: 5, name: 'Metro Pulse', artist: 'Lab Audio', seconds: 190, frequency: 349.23 },
];

function readRelease(result: ExecutionResult | null): ReleaseResult | null {
  if (!result?.stdout || result.exitCode !== 0) return null;
  const line = result.stdout.split('\n').find((s) => s.startsWith('__AISE_PLAYLIST__ '));
  if (!line) return null;
  try {
    const x = JSON.parse(line.slice('__AISE_PLAYLIST__ '.length));
    return Array.isArray(x.selected_ids) && typeof x.policy_enforced === 'boolean'
      ? x as ReleaseResult : null;
  } catch {
    return null;
  }
}

const CASE_PROMPT = `You are a software requirements engineer reviewing a hypothetical
Spotify-compatible playlist-management client. Consult the official
Spotify Web API documentation before making API claims:
D1 https://developer.spotify.com/documentation/web-api/concepts/playlists
D2 https://developer.spotify.com/documentation/web-api/reference/change-playlist-details
D3 https://developer.spotify.com/documentation/web-api/reference/add-items-to-playlist
D4 https://developer.spotify.com/documentation/web-api/reference/remove-items-playlist

These are FICTIONAL classroom feature requirements and estimated days:
FR-01 Edit title/description: 2 days, ratings listener=3, product=4, engineer=5
FR-02 Publish on owner's profile: 2 days, ratings 4,5,4
FR-03 Private collaborative playlist: 4 days, ratings 5,4,3
FR-04 Add item: 2 days, ratings 5,4,5
FR-05 Remove item with snapshot awareness: 4 days, ratings 3,3,4
FR-06 Allow public AND collaborative on one playlist: 2 days, ratings 5,5,5

The teaching scenario has 8 engineer-days; FR-05 requires FR-04.
Utility weights are listener 0.50, product 0.30, engineer 0.20.
The ratings and costs are NOT actual Spotify data.
Check the public/collaborative rule in D1, then return:
1. ranked_ids (all six requirement IDs)
2. infeasible_ids and documented reasons
3. release_ids and total_engineer_days
4. evidence with D1-D4 references
5. unsupported assumptions and one question for a stakeholder.
Do not invent browsing or source verification; say when you could not
open a page. Explain why the selected release meets all constraints.`;

const time = (n: number) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;

interface Props { result: ExecutionResult | null; onOpenCode: () => void; }

export const Lab02SpotifyCasePanel: React.FC<Props> = ({ result, onOpenCode }) => {
  const release = useMemo(() => readRelease(result), [result]);
  const [title, setTitle] = useState('Software Engineering Mix');
  const [description, setDescription] = useState('A requirements engineering playlist sandbox');
  const [draftTitle, setDraftTitle] = useState(title);
  const [publicState, setPublicState] = useState(false);
  const [collaborative, setCollaborative] = useState(false);
  const [tracks, setTracks] = useState(INITIAL_TRACKS);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [activeSource, setActiveSource] = useState('D1');
  const [info, setInfo] = useState('Select a playlist action to inspect its requirements.');
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);

  // A short synthesized tone is a local preview, NOT copyrighted Spotify audio.
  useEffect(() => {
    if (!playing || currentId === null) return;
    const track = tracks.find((x) => x.id === currentId);
    if (!track) return;
    let tick = 0;
    const playTone = () => {
      try {
        const AudioConstructor = window.AudioContext;
        if (!AudioConstructor) return;
        const ctx = audioRef.current || new AudioConstructor();
        audioRef.current = ctx;
        void ctx.resume();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = track.frequency * [1, 1.25, 1.5, 1.25][tick++ % 4];
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
        oscillator.connect(gain).connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.3);
      } catch {
        // Audio is optional; playlist engineering interactions remain usable.
      }
    };
    playTone();
    const interval = window.setInterval(playTone, 450);
    return () => window.clearInterval(interval);
  }, [playing, currentId, tracks]);

  useEffect(() => () => { void audioRef.current?.close(); }, []);
  const enforced = release?.policy_enforced ?? false;
  const conflict = publicState && collaborative;
  const selected = new Set(release?.selected_ids ?? []);
  const source = SOURCES.find((item) => item.id === activeSource) || SOURCES[0];

  function changeState(field: 'public' | 'collaborative', checked: boolean) {
    const nextPublic = field === 'public' ? checked : publicState;
    const nextCollaborative = field === 'collaborative' ? checked : collaborative;
    if (checked && nextPublic && nextCollaborative && enforced) {
      setInfo('BLOCKED by the corrected Python policy: a playlist cannot be both public and collaborative (D1).');
      return;
    }
    setPublicState(nextPublic);
    setCollaborative(nextCollaborative);
    setInfo(nextPublic && nextCollaborative
      ? 'INVALID configuration! Your Python starter still accepts FR-06. Verify the conflict against D1 and fix playlist_policy_ok().'
      : 'Playlist attributes changed in the local sandbox. Check their real API semantics in D1 and D2.');
  }

  function addTrack() {
    const extra = EXTRA_TRACKS.find((track) => !tracks.some((x) => x.id === track.id));
    if (!extra) { setInfo('All sample tracks have been added.'); return; }
    setTracks((items) => [...items, extra]);
    setInfo('FR-04 demonstrated. This is a local addition, not a Spotify Web API request. See D3.');
  }

  function removeTrack(id: number) {
    setTracks((items) => items.filter((item) => item.id !== id));
    if (currentId === id) { setPlaying(false); setCurrentId(null); }
    setInfo('FR-05 demonstrated. Real implementations must handle authorization and playlist versions (D4).');
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(CASE_PROMPT);
      setCopied(true);
      setInfo('Case prompt copied. Paste it into ChatGPT or Gemini, then verify all API claims yourself.');
      window.setTimeout(() => setCopied(false), 1800);
    } catch { setInfo('Clipboard unavailable. Copy the case text from the laboratory sheet instead.'); }
  }

  return (
    <div className="h-full overflow-auto bg-[#0c1010] text-white font-sans">
      <div className="mx-auto max-w-[1500px] p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#151a1a] px-4 py-3">
          <div className="flex items-center gap-2">
            <Music2 className="h-5 w-5 text-[#1ed760]" />
            <span className="font-semibold">Spotify-style Playlist Case Studio</span>
            <span className="rounded bg-amber-300/15 px-2 py-1 text-[10px] text-amber-200">LOCAL CLASSROOM SIMULATOR</span>
          </div>
          <button onClick={onOpenCode} className="rounded-md bg-[#1ed760] px-4 py-2 text-xs font-bold text-black hover:bg-[#46f783]">
            Open Python & Verify Requirements
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[210px_minmax(0,1fr)_320px]">
          <aside className="space-y-4 rounded-xl bg-[#151a1a] p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold"><Library className="h-4 w-4" /> Your Library</h3>
            <div className="rounded-lg bg-[#26302c] p-3">
              <div className="font-semibold text-sm">{title}</div>
              <div className="mt-1 text-xs text-white/60">{tracks.length} local demo tracks</div>
              <div className="mt-2 text-[11px] text-[#1ed760]">Editable playlist demo</div>
            </div>
            <h3 className="pt-2 text-xs font-bold uppercase tracking-wider text-white/50">Official sources</h3>
            {SOURCES.map((doc) => (
              <button key={doc.id} onClick={() => setActiveSource(doc.id)}
                className={`block w-full rounded-md px-2 py-2 text-left text-xs ${activeSource === doc.id ? 'bg-[#264433] text-[#1ed760]' : 'text-white/65 hover:bg-white/10'}`}>
                <strong>{doc.id}</strong> {doc.label}
              </button>
            ))}
            <div className="border-t border-white/10 pt-3 text-[11px] leading-5 text-white/50">
              These are <strong>short summaries</strong> with links to real Spotify docs, not Spotify's internal SRS.
            </div>
          </aside>

          <main className="min-w-0 overflow-hidden rounded-xl bg-gradient-to-b from-[#244b3c] via-[#182321] to-[#151a1a] p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-700 to-indigo-900 shadow-lg sm:h-36 sm:w-36">
                <Music2 className="h-12 w-12 text-white/80" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/65">Playlist prototype</span>
                <h1 className="mt-1 break-words text-2xl font-black sm:text-4xl">{title}</h1>
                <p className="mt-2 text-xs text-white/70">{description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-full bg-black/35 px-2 py-1">{publicState ? 'Public' : 'Not public'}</span>
                  <span className="rounded-full bg-black/35 px-2 py-1">{collaborative ? 'Collaborative' : 'Not collaborative'}</span>
                  <span className="rounded-full bg-black/35 px-2 py-1">{tracks.length} demo songs</span>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-white/10 bg-black/25 p-4">
              <h2 className="mb-3 text-sm font-bold">Test playlist requirements</h2>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={publicState} onChange={(e) => changeState('public', e.target.checked)}
                    className="accent-[#1ed760]" />
                  Publish playlist (FR-02)
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={collaborative} onChange={(e) => changeState('collaborative', e.target.checked)}
                    className="accent-[#1ed760]" />
                  Collaborative (FR-03)
                </label>
                <button className="rounded border border-white/25 px-3 py-1.5 text-xs hover:bg-white/10"
                  onClick={() => { changeState('public', true); if (!enforced) { setPublicState(true); setCollaborative(true); setInfo('FR-06: invalid public+collaborative state accepted by the starter policy. Fix the Python guardrail and rerun.'); } else { setInfo('FR-06 blocked by corrected Python policy. See D1.'); } }}>
                  Try invalid FR-06
                </button>
              </div>
              <div className={`mt-3 flex items-start gap-2 rounded-md p-3 text-xs leading-5 ${conflict ? 'bg-rose-950/70 text-rose-200' : 'bg-emerald-950/50 text-emerald-100'}`}>
                {conflict ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />}
                <span>{conflict
                  ? 'INVALID API state: both public and collaborative are true. Source D1 prohibits this.'
                  : enforced
                    ? 'Corrected Python guardrail active. Conflicting state changes are blocked.'
                    : 'Policy currently not verified. Run Python to load the student policy; the starter accepts an invalid state.'}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-white/65" aria-live="polite">{info}</p>
            </div>

            <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold">Edit playlist (FR-01)</h2>
                <span className="text-[10px] text-white/50">Demo, no Spotify OAuth calls</span>
              </div>
              <div className="flex gap-2">
                <input aria-label="Playlist title" value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)}
                  maxLength={70} className="min-w-0 flex-1 rounded-md border border-white/20 bg-[#171a1a] px-3 py-2 text-xs text-white outline-none focus:border-[#1ed760]" />
                <button onClick={() => {
                  if (!draftTitle.trim()) { setInfo('A playlist title cannot be empty in this teaching scenario.'); return; }
                  setTitle(draftTitle.trim()); setInfo('FR-01 exercised locally. Verify the authorization requirement in D2.');
                }} className="flex items-center gap-1 rounded bg-white/15 px-3 py-2 text-xs hover:bg-white/25">
                  <Save className="h-3.5 w-3.5" /> Save
                </button>
              </div>
              <input aria-label="Playlist description" value={description} onChange={(e) => setDescription(e.target.value)}
                maxLength={160} className="mt-2 w-full rounded-md border border-white/20 bg-[#171a1a] px-3 py-2 text-xs text-white outline-none focus:border-[#1ed760]" />
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-white/10 bg-black/20">
              <div className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div>
                  <h2 className="text-sm font-bold">Playlist items (FR-04 / FR-05)</h2>
                  <p className="mt-1 text-[11px] text-white/55">Click Play to hear a synthesized sample, not Spotify media.</p>
                </div>
                <button onClick={addTrack} className="flex items-center gap-1 rounded-full bg-[#1ed760] px-3 py-2 text-xs font-bold text-black hover:bg-[#4af48b]">
                  <Plus className="h-4 w-4" /> Add track
                </button>
              </div>
              <div className="divide-y divide-white/10">
                {tracks.map((track, idx) => (
                  <div key={track.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5">
                    <button onClick={() => { if (currentId === track.id) setPlaying((x) => !x); else { setCurrentId(track.id); setPlaying(true); } }}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-white/10 hover:bg-white/20"
                      aria-label={playing && currentId === track.id ? 'Pause track' : 'Play track'}>
                      {playing && currentId === track.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <span className="w-5 text-xs text-white/45">{idx + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{track.name}</div>
                      <div className="text-xs text-white/55">{track.artist}</div>
                    </div>
                    <span className="text-xs text-white/45">{time(track.seconds)}</span>
                    <button onClick={() => removeTrack(track.id)} aria-label={`Remove ${track.name}`}
                      className="rounded p-2 text-white/50 hover:bg-rose-700/30 hover:text-rose-200">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-white/10 bg-black/25 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Heart className="h-4 w-4 text-[#1ed760]" /> AI-assisted release comparison</div>
              {!release ? (
                <p className="text-xs leading-5 text-white/65">No Python release result yet. Run the starter from the Code tab, then return to see which requirements were selected and whether FR-06 passes the student's actual guardrail.</p>
              ) : (
                <>
                  <p className="text-xs text-white/75">Selected {release.selected_ids.length} requirements · {release.days_used}/{release.budget} engineer-days · utility {release.total_utility.toFixed(2)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {release.selected_ids.map((id) => <span key={id} className="rounded-full bg-[#1ed760]/15 px-3 py-1 text-[11px] font-bold text-[#4cfa9c]">{id}</span>)}
                  </div>
                </>
              )}
            </div>
          </main>

          <aside className="min-w-0 space-y-4">
            <section className="rounded-xl border border-white/10 bg-[#151a1a] p-4">
              <h2 className="flex items-center gap-2 text-sm font-bold"><BookOpen className="h-4 w-4 text-[#1ed760]" /> Official API Evidence</h2>
              <p className="mt-1 text-[11px] leading-5 text-white/55">Select D1–D4 and open the real documentation to inspect the complete requirements.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SOURCES.map((doc) => <button key={doc.id} onClick={() => setActiveSource(doc.id)}
                  className={`rounded px-3 py-1.5 text-xs font-bold ${doc.id === activeSource ? 'bg-[#1ed760] text-black' : 'bg-white/10 hover:bg-white/20'}`}>
                  {doc.id}
                </button>)}
              </div>
              <h3 className="mt-4 text-sm font-semibold">{source.label}</h3>
              <p className="mt-2 text-xs leading-6 text-white/70">{source.summary}</p>
              <div className="mt-3 rounded-md border-l-2 border-[#1ed760] bg-white/5 p-3 text-xs leading-5 text-white/80">
                <strong>Try it:</strong> {source.verify}
              </div>
              <a href={source.url} target="_blank" rel="noreferrer"
                className="mt-4 flex items-center gap-2 rounded-md border border-[#1ed760]/60 px-3 py-2 text-xs font-semibold text-[#53ef92] hover:bg-[#1ed760]/10">
                Open official {source.id} documentation <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <p className="mt-2 text-[10px] text-white/50">The external docs open in a new tab. They are not embedded because third-party sites can block iframes.</p>
            </section>

            <section className="rounded-xl border border-white/10 bg-[#151a1a] p-4">
              <h2 className="text-sm font-bold">Candidate requirements</h2>
              <div className="mt-3 space-y-2">
                {CANDIDATES.map((req) => (
                  <div key={req.id} className="rounded-md border border-white/10 bg-black/20 p-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <strong className="text-white">{req.id}</strong>
                      <span className={req.invalid ? 'text-rose-300' : selected.has(req.id) ? 'text-[#1ed760]' : 'text-white/50'}>
                        {req.invalid ? 'Documented conflict' : selected.has(req.id) ? 'In planned release' : 'Not selected / not run'}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-white/80">{req.title}</div>
                    <div className="mt-1 text-[10px] text-white/45">{req.days} fictional engineer-days · {req.doc}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-[#151a1a] p-4">
              <h2 className="flex items-center gap-2 text-sm font-bold"><Users className="h-4 w-4 text-[#1ed760]" /> External AI review</h2>
              <p className="mt-2 text-xs leading-5 text-white/65">Use ChatGPT or Gemini in your own browser. This lab has no embedded LLM, provider credits, or chatbot setup.</p>
              <button onClick={() => void copyPrompt()}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-[#1ed760] px-3 py-2.5 text-xs font-bold text-black hover:bg-[#53ec90]">
                <ClipboardCopy className="h-4 w-4" /> {copied ? 'Copied!' : 'Copy grounded case prompt'}
              </button>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <a href="https://chatgpt.com/" target="_blank" rel="noreferrer" className="rounded-md border border-white/20 px-2 py-2 text-center text-xs hover:bg-white/10">Open ChatGPT ↗</a>
                <a href="https://gemini.google.com/" target="_blank" rel="noreferrer" className="rounded-md border border-white/20 px-2 py-2 text-center text-xs hover:bg-white/10">Open Gemini ↗</a>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-white/55">Paste the AI's ranking into AI_SUGGESTED_ORDER in Code. Verify technical rules manually against D1–D4.</p>
            </section>
          </aside>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#151a1a] p-3 text-[11px] text-white/55">
          <span>Local educational simulator only. No Spotify login, tracks, account data, API tokens, or copyrighted recordings.</span>
          <span className="flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> No external data stored by this component</span>
        </div>
      </div>
    </div>
  );
};
