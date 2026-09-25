import React, { useMemo, useState } from 'react';
import {
  Accessibility,
  ChevronRight,
  Heart,
  Home,
  Languages,
  Library,
  ListMusic,
  Music2,
  Pause,
  Play,
  Podcast,
  Search,
  SkipBack,
  SkipForward,
  Sparkles,
  Terminal,
  Ticket,
  Users,
  Volume2,
  WifiOff,
  AudioLines,
} from 'lucide-react';
import type { ExecutionResult } from '../../lib/runners/types';
import { OutputConsolePanel } from './OutputConsolePanel';

interface PreviewRequirement {
  id: string;
  title: string;
  score: number;
  moscow: string;
  effort: number;
  visual_feature: string;
}

interface PreviewPayload {
  mode: 'BASELINE' | 'AI_ASSISTED' | string;
  budget: number;
  budget_used: number;
  selected: PreviewRequirement[];
  ranking: Array<{
    id: string;
    title: string;
    score: number;
    predicted_priority: string;
    p_high: number;
    confidence: number;
    evidence_tokens: string[];
    effort: number;
  }>;
}

interface Lab02ProductPreviewPanelProps {
  result: ExecutionResult | null;
  isRunning: boolean;
  onClearConsole: () => void;
  onRestartRuntime: () => void;
  onAddOutputToReport: (output: string) => void;
  onAddPlotToReport: (plotBase64: string, caption?: string) => void;
}

const parsePreview = (stdout?: string): PreviewPayload | null => {
  if (!stdout) return null;

  const marker = '__AISE_PREVIEW__ ';
  const lines = stdout.split('\n').reverse();
  const line = lines.find((item) => item.startsWith(marker));

  if (!line) return null;

  try {
    return JSON.parse(line.slice(marker.length)) as PreviewPayload;
  } catch {
    return null;
  }
};

const AlbumTile: React.FC<{
  title: string;
  subtitle: string;
  gradient: string;
  circular?: boolean;
}> = ({ title, subtitle, gradient, circular }) => (
  <div className="group min-w-0">
    <div
      className={`aspect-square w-full shadow-lg ${circular ? 'rounded-full' : 'rounded-md'} ${gradient} relative overflow-hidden`}
    >
      <div className="absolute inset-0 bg-black/10" />
      <div className="absolute left-2 bottom-2 text-[9px] font-black tracking-tight text-white drop-shadow">
        {title.slice(0, 12).toUpperCase()}
      </div>
      <div className="absolute right-2 bottom-2 h-7 w-7 rounded-full bg-[#1ed760] text-black opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-lg transition">
        <Play className="h-3.5 w-3.5 fill-current" />
      </div>
    </div>
    <div className="mt-2 truncate text-[10px] font-semibold text-white">{title}</div>
    <div className="mt-0.5 line-clamp-2 text-[8px] leading-3 text-zinc-400">{subtitle}</div>
  </div>
);

export const Lab02ProductPreviewPanel: React.FC<Lab02ProductPreviewPanelProps> = ({
  result,
  isRunning,
  onClearConsole,
  onRestartRuntime,
  onAddOutputToReport,
  onAddPlotToReport,
}) => {
  const [tab, setTab] = useState<'preview' | 'console'>('preview');
  const payload = useMemo(() => parsePreview(result?.stdout), [result?.stdout]);
  const selected = new Set(payload?.selected.map((item) => item.visual_feature) || []);

  const hasAiDj = selected.has('ai_dj');
  const hasLyricsTranslation = selected.has('lyrics_translation');
  const hasQueueVoting = selected.has('queue_voting');
  const hasDataSaver = selected.has('data_saver');
  const hasLossless = selected.has('lossless');
  const hasAccessibleLyrics = selected.has('accessible_lyrics');
  const hasConcerts = selected.has('concerts');
  const hasPodcastSummary = selected.has('podcast_summary');

  return (
    <div className="h-full flex flex-col bg-slate-950">
      <div className="h-9 shrink-0 border-b border-slate-800 bg-slate-900 px-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTab('preview')}
            className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              tab === 'preview'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music2 className="w-3.5 h-3.5 text-[#1ed760]" />
            Product Preview
          </button>
          <button
            onClick={() => setTab('console')}
            className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              tab === 'console'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Console
          </button>
        </div>

        <div className="text-[10px] text-slate-400 font-mono">
          {isRunning
            ? 'Updating…'
            : payload
              ? `${payload.mode.replace('_', ' ')} · ${payload.budget_used}/${payload.budget} pts`
              : 'Run Python to update'}
        </div>
      </div>

      {tab === 'console' ? (
        <div className="flex-1 min-h-0">
          <OutputConsolePanel
            result={result}
            isRunning={isRunning}
            onClearConsole={onClearConsole}
            onRestartRuntime={onRestartRuntime}
            onAddOutputToReport={onAddOutputToReport}
            onAddPlotToReport={onAddPlotToReport}
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-auto bg-[#050505] p-3">
          <div className="min-h-full overflow-hidden rounded-xl border border-zinc-800 bg-[#121212] shadow-2xl text-white">
            <div className="h-8 bg-[#090909] flex items-center justify-between px-3 border-b border-white/5">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500/90" />
                <span className="h-2 w-2 rounded-full bg-amber-400/90" />
                <span className="h-2 w-2 rounded-full bg-emerald-500/90" />
              </div>
              <div className="flex items-center gap-2">
                {hasDataSaver && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#1ed760]/15 px-2 py-0.5 text-[8px] font-semibold text-[#1ed760]">
                    <WifiOff className="h-2.5 w-2.5" />
                    Data Saver
                  </span>
                )}
                <span className="text-[8px] text-zinc-500">Educational product mockup</span>
              </div>
            </div>

            <div className="grid min-h-[455px] grid-cols-[46px_minmax(0,1fr)_132px]">
              <aside className="border-r border-white/5 bg-[#0a0a0a] py-3 flex flex-col items-center gap-4">
                <div className="h-7 w-7 rounded-full bg-[#1ed760] text-black flex items-center justify-center">
                  <AudioLines className="h-4 w-4" />
                </div>
                <Home className="h-4 w-4 text-white" />
                <Search className="h-4 w-4 text-zinc-500" />
                <Library className="h-4 w-4 text-zinc-500" />
                <div className="mt-1 h-px w-5 bg-zinc-800" />
                <Heart className="h-4 w-4 text-zinc-500" />
                <ListMusic className="h-4 w-4 text-zinc-500" />
              </aside>

              <main className="min-w-0 bg-gradient-to-b from-[#243329] via-[#181818] to-[#121212] p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-[8px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                      Spotify
                    </div>
                    <h3 className="mt-0.5 text-lg font-bold tracking-tight">Good afternoon</h3>
                  </div>
                  <div className="h-6 w-6 rounded-full bg-zinc-800 text-[8px] font-bold flex items-center justify-center">
                    K
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    ['Liked Songs', 'from-purple-700 to-indigo-400'],
                    ['Discover Weekly', 'from-emerald-700 to-lime-400'],
                    ['Daily Mix 1', 'from-orange-600 to-pink-500'],
                    ['Release Radar', 'from-blue-700 to-cyan-400'],
                  ].map(([name, gradient]) => (
                    <div
                      key={name}
                      className="h-9 overflow-hidden rounded bg-white/10 flex items-center gap-2 hover:bg-white/15"
                    >
                      <div className={`h-9 w-9 shrink-0 bg-gradient-to-br ${gradient}`} />
                      <span className="truncate text-[9px] font-semibold">{name}</span>
                    </div>
                  ))}
                </div>

                {hasAiDj && (
                  <div className="mt-3 rounded-lg bg-gradient-to-r from-[#1ed760]/20 via-[#153f2a] to-[#243329] border border-[#1ed760]/20 p-2.5 flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-md bg-[#1ed760] text-black flex items-center justify-center shadow-lg">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[8px] uppercase tracking-[0.15em] text-[#1ed760] font-bold">New release feature</div>
                      <div className="truncate text-[11px] font-bold">AI DJ · Focus Mix</div>
                      <div className="text-[8px] text-zinc-300">Context-aware listening session</div>
                    </div>
                    <div className="h-7 w-7 rounded-full bg-[#1ed760] text-black flex items-center justify-center">
                      <Play className="h-3.5 w-3.5 fill-current" />
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <h4 className="text-[12px] font-bold">Made for Karim</h4>
                  <span className="text-[8px] font-semibold text-zinc-400">Show all</span>
                </div>

                <div className="mt-2 grid grid-cols-3 gap-2">
                  <AlbumTile
                    title="Daily Mix"
                    subtitle="Drake, The Weeknd, SZA and more"
                    gradient="bg-gradient-to-br from-violet-700 to-fuchsia-400"
                  />
                  <AlbumTile
                    title="Chill Mix"
                    subtitle="Music to slow the day down"
                    gradient="bg-gradient-to-br from-sky-700 to-cyan-300"
                  />
                  <AlbumTile
                    title={hasConcerts ? 'Live Near You' : 'Discover Mix'}
                    subtitle={hasConcerts ? 'Concerts from artists you follow' : 'Fresh picks based on your listening'}
                    gradient={hasConcerts
                      ? 'bg-gradient-to-br from-rose-700 to-orange-400'
                      : 'bg-gradient-to-br from-emerald-700 to-teal-300'}
                  />
                </div>

                {hasPodcastSummary && (
                  <div className="mt-3 rounded-md bg-white/5 p-2 flex items-center gap-2">
                    <Podcast className="h-4 w-4 text-[#1ed760]" />
                    <div className="min-w-0">
                      <div className="text-[9px] font-semibold">60-second episode summary</div>
                      <div className="truncate text-[8px] text-zinc-400">AI-generated key moments before you listen</div>
                    </div>
                  </div>
                )}
              </main>

              <aside className="border-l border-white/5 bg-[#101010] p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold">Now playing</span>
                  <ChevronRight className="h-3 w-3 text-zinc-500" />
                </div>

                <div className="mt-2 aspect-square rounded-md bg-gradient-to-br from-sky-800 via-indigo-700 to-violet-400 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="absolute left-2 bottom-2 text-[10px] font-black">MIDNIGHT</div>
                </div>

                <div className="mt-2">
                  <div className="text-[10px] font-semibold">Midnight City</div>
                  <div className="text-[8px] text-zinc-500">M83</div>
                </div>

                {(hasLyricsTranslation || hasAccessibleLyrics) && (
                  <div className={`mt-3 rounded-md border p-2 ${
                    hasAccessibleLyrics
                      ? 'border-white/20 bg-black text-white'
                      : 'border-zinc-800 bg-zinc-900'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-bold">Lyrics</span>
                      <div className="flex items-center gap-1">
                        {hasLyricsTranslation && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#1ed760]/15 px-1.5 py-0.5 text-[7px] font-semibold text-[#1ed760]">
                            <Languages className="h-2 w-2" />
                            EN → BM
                          </span>
                        )}
                        {hasAccessibleLyrics && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[7px] font-semibold text-white">
                            <Accessibility className="h-2 w-2" />
                            A+
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`mt-1.5 leading-tight ${
                      hasAccessibleLyrics ? 'text-[10px] font-semibold' : 'text-[8px] text-zinc-300'
                    }`}>
                      Waiting in the car<br />
                      Waiting for the ride<br />
                      in the dark…
                    </div>
                  </div>
                )}

                {hasQueueVoting && (
                  <div className="mt-3">
                    <div className="flex items-center gap-1 text-[8px] font-bold">
                      <Users className="h-3 w-3 text-[#1ed760]" />
                      Group queue
                    </div>
                    <div className="mt-1.5 space-y-1">
                      {[
                        ['Blinding Lights', '+18'],
                        ['Kill Bill', '+12'],
                        ['One Dance', '+9'],
                      ].map(([track, votes]) => (
                        <div key={track} className="rounded bg-white/5 px-1.5 py-1 flex items-center justify-between">
                          <span className="truncate text-[7px] text-zinc-300">{track}</span>
                          <span className="text-[7px] font-bold text-[#1ed760]">{votes}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!hasQueueVoting && !hasLyricsTranslation && !hasAccessibleLyrics && (
                  <div className="mt-3 rounded-md bg-white/5 p-2">
                    <div className="text-[8px] font-semibold">Your queue</div>
                    <div className="mt-1 text-[7px] leading-3 text-zinc-500">
                      Songs you add will appear here.
                    </div>
                  </div>
                )}
              </aside>
            </div>

            <div className="h-16 border-t border-white/5 bg-[#0b0b0b] px-3 grid grid-cols-[1fr_1.4fr_1fr] items-center gap-2">
              <div className="min-w-0 flex items-center gap-2">
                <div className="h-9 w-9 rounded bg-gradient-to-br from-sky-800 to-violet-400 shrink-0" />
                <div className="min-w-0">
                  <div className="truncate text-[9px] font-semibold">Midnight City</div>
                  <div className="truncate text-[7px] text-zinc-500">M83</div>
                </div>
                <Heart className="h-3 w-3 text-zinc-500" />
              </div>

              <div>
                <div className="flex items-center justify-center gap-3">
                  <SkipBack className="h-3 w-3 text-zinc-400" />
                  <div className="h-7 w-7 rounded-full bg-white text-black flex items-center justify-center">
                    <Pause className="h-3.5 w-3.5 fill-current" />
                  </div>
                  <SkipForward className="h-3 w-3 text-zinc-400" />
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-[6px] text-zinc-500">
                  <span>1:42</span>
                  <div className="h-1 flex-1 rounded-full bg-zinc-700">
                    <div className="h-1 w-[44%] rounded-full bg-white" />
                  </div>
                  <span>4:03</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 text-zinc-400">
                {hasLossless && (
                  <span className="rounded border border-[#1ed760]/40 px-1.5 py-0.5 text-[7px] font-bold text-[#1ed760]">
                    LOSSLESS
                  </span>
                )}
                {hasDataSaver && (
                  <span className="rounded border border-sky-400/30 px-1.5 py-0.5 text-[7px] font-bold text-sky-300">
                    DATA SAVER
                  </span>
                )}
                <Volume2 className="h-3 w-3" />
                <div className="h-1 w-10 rounded-full bg-zinc-700">
                  <div className="h-1 w-7 rounded-full bg-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {payload?.selected.map((item) => (
              <span
                key={item.id}
                className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-1 text-[9px] text-zinc-300"
              >
                {item.title}
              </span>
            ))}
            {!payload && (
              <span className="text-[10px] text-zinc-500">
                Run the baseline first. The interface will update when Python emits the release plan.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
