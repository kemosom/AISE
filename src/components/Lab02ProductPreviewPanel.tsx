import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Accessibility,
  Activity,
  AudioLines,
  BrainCircuit,
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
  ThumbsUp,
  Users,
  Volume2,
  WifiOff,
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

interface RankingRow {
  id: string;
  title: string;
  description: string;
  score: number;
  predicted_priority: string;
  p_high: number;
  p_medium: number;
  p_low: number;
  confidence: number;
  evidence_tokens: string[];
  effort: number;
  user_votes: number;
  business_value: number;
  strategic_fit: number;
  accessibility_impact: boolean;
  visual_feature: string;
}

interface PreviewPayload {
  mode: 'BASELINE' | 'AI_ASSISTED' | string;
  budget: number;
  budget_used: number;
  model?: {
    name: string;
    accuracy: number;
    macro_f1: number;
    classes: string[];
  };
  selected: PreviewRequirement[];
  ranking: RankingRow[];
}

export interface NlpPlaygroundPrediction {
  label: string;
  p_high: number;
  p_medium: number;
  p_low: number;
  confidence: number;
  evidence_tokens: string[];
}

interface Lab02ProductPreviewPanelProps {
  result: ExecutionResult | null;
  isRunning: boolean;
  onClearConsole: () => void;
  onRestartRuntime: () => void;
  onAddOutputToReport: (output: string) => void;
  onAddPlotToReport: (plotBase64: string, caption?: string) => void;
  onAnalyzeRequirement?: (text: string) => Promise<NlpPlaygroundPrediction>;
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

const TRACKS = [
  {
    title: 'Neon Skyline',
    artist: 'AISE Sessions',
    duration: 158,
    gradient: 'from-indigo-800 via-violet-700 to-fuchsia-500',
    notes: [261.63, 329.63, 392.0, 329.63, 293.66, 349.23, 440.0, 349.23],
  },
  {
    title: 'Night Drive',
    artist: 'Studio One',
    duration: 174,
    gradient: 'from-sky-800 via-blue-700 to-cyan-400',
    notes: [220.0, 277.18, 329.63, 277.18, 246.94, 311.13, 369.99, 311.13],
  },
  {
    title: 'Sunset Loop',
    artist: 'North Avenue',
    duration: 146,
    gradient: 'from-orange-700 via-rose-600 to-pink-400',
    notes: [196.0, 246.94, 293.66, 246.94, 220.0, 261.63, 329.63, 261.63],
  },
  {
    title: 'Focus Flow',
    artist: 'AI DJ',
    duration: 186,
    gradient: 'from-emerald-800 via-green-600 to-lime-400',
    notes: [174.61, 220.0, 261.63, 220.0, 196.0, 246.94, 293.66, 246.94],
  },
];

const formatTime = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
};

const ProbabilityBar: React.FC<{
  label: string;
  value: number;
  tone: string;
}> = ({ label, value, tone }) => (
  <div>
    <div className="mb-1 flex items-center justify-between text-[10px]">
      <span className="font-semibold text-slate-300">{label}</span>
      <span className="font-mono text-slate-400">{(value * 100).toFixed(1)}%</span>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
      <div
        className={`h-full rounded-full ${tone} transition-all duration-500`}
        style={{ width: `${Math.max(2, value * 100)}%` }}
      />
    </div>
  </div>
);

export const Lab02ProductPreviewPanel: React.FC<Lab02ProductPreviewPanelProps> = ({
  result,
  isRunning,
  onClearConsole,
  onRestartRuntime,
  onAddOutputToReport,
  onAddPlotToReport,
  onAnalyzeRequirement,
}) => {
  const [tab, setTab] = useState<'preview' | 'model' | 'console'>('preview');
  const payload = useMemo(() => parsePreview(result?.stdout), [result?.stdout]);
  const selectedFeatures = useMemo(
    () => new Set(payload?.selected.map((item) => item.visual_feature) || []),
    [payload]
  );

  const [activeRequirementId, setActiveRequirementId] = useState<string>('');
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.55);
  const [liked, setLiked] = useState(false);
  const [activeNav, setActiveNav] = useState<'home' | 'search' | 'library'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTranslatedLyrics, setShowTranslatedLyrics] = useState(true);
  const [queueVotes, setQueueVotes] = useState<Record<string, number>>({
    'Neon Skyline': 18,
    'Night Drive': 12,
    'Sunset Loop': 9,
  });
  const [playgroundText, setPlaygroundText] = useState(
    'Add a low-data playback mode for commuters on unstable mobile networks'
  );
  const [playgroundPrediction, setPlaygroundPrediction] =
    useState<NlpPlaygroundPrediction | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const synthIntervalRef = useRef<number | null>(null);
  const noteIndexRef = useRef(0);

  const currentTrack = TRACKS[currentTrackIndex];

  const activeRequirement = useMemo(() => {
    if (!payload?.ranking.length) return null;
    return (
      payload.ranking.find((row) => row.id === activeRequirementId) ||
      payload.ranking[0]
    );
  }, [payload, activeRequirementId]);

  useEffect(() => {
    if (payload?.ranking.length && !activeRequirementId) {
      setActiveRequirementId(payload.ranking[0].id);
    }
  }, [payload, activeRequirementId]);

  const hasAiDj = selectedFeatures.has('ai_dj');
  const hasLyricsTranslation = selectedFeatures.has('lyrics_translation');
  const hasQueueVoting = selectedFeatures.has('queue_voting');
  const hasDataSaver = selectedFeatures.has('data_saver');
  const hasLossless = selectedFeatures.has('lossless');
  const hasAccessibleLyrics = selectedFeatures.has('accessible_lyrics');
  const hasConcerts = selectedFeatures.has('concerts');
  const hasPodcastSummary = selectedFeatures.has('podcast_summary');

  const stopSynth = () => {
    if (synthIntervalRef.current !== null) {
      window.clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
  };

  const playPulse = () => {
    const context = audioContextRef.current;
    if (!context) return;

    const track = TRACKS[currentTrackIndex];
    const frequency = track.notes[noteIndexRef.current % track.notes.length];
    noteIndexRef.current += 1;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const bass = context.createOscillator();
    const bassGain = context.createGain();

    oscillator.type = currentTrackIndex === 3 ? 'triangle' : 'sine';
    oscillator.frequency.value = frequency;

    bass.type = 'sine';
    bass.frequency.value = frequency / 2;

    const now = context.currentTime;
    const level = Math.max(0.0001, volume * 0.075);
    const bassLevel = Math.max(0.0001, volume * 0.03);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(level, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

    bassGain.gain.setValueAtTime(0.0001, now);
    bassGain.gain.exponentialRampToValueAtTime(bassLevel, now + 0.02);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    oscillator.connect(gain).connect(context.destination);
    bass.connect(bassGain).connect(context.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.26);
    bass.start(now);
    bass.stop(now + 0.3);
  };

  const startSynth = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    await audioContextRef.current.resume();
    stopSynth();
    noteIndexRef.current = 0;
    playPulse();
    synthIntervalRef.current = window.setInterval(playPulse, 320);
  };

  useEffect(() => {
    if (isPlaying) {
      void startSynth();
    } else {
      stopSynth();
    }

    return () => stopSynth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentTrackIndex, volume]);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = window.setInterval(() => {
      setProgress((value) => {
        const next = value + 1;
        return next >= currentTrack.duration ? 0 : next;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isPlaying, currentTrack.duration]);

  useEffect(() => {
    return () => {
      stopSynth();
      void audioContextRef.current?.close();
    };
  }, []);

  const chooseTrack = (index: number) => {
    setCurrentTrackIndex(index);
    setProgress(0);
  };

  const nextTrack = () => {
    chooseTrack((currentTrackIndex + 1) % TRACKS.length);
  };

  const previousTrack = () => {
    chooseTrack((currentTrackIndex - 1 + TRACKS.length) % TRACKS.length);
  };

  const filteredTracks = TRACKS.filter((track) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      track.title.toLowerCase().includes(query) ||
      track.artist.toLowerCase().includes(query)
    );
  });

  const handleAnalyze = async () => {
    if (!onAnalyzeRequirement || !playgroundText.trim()) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const prediction = await onAnalyzeRequirement(playgroundText.trim());
      setPlaygroundPrediction(prediction);
    } catch (error: any) {
      setAnalysisError(error?.message || 'Unable to run the NLP model.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950">
      <div className="h-10 shrink-0 border-b border-slate-800 bg-slate-900 px-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTab('preview')}
            className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              tab === 'preview'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music2 className="w-3.5 h-3.5 text-[#1ed760]" />
            Live Product
          </button>
          <button
            onClick={() => setTab('model')}
            className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              tab === 'model'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5 text-violet-400" />
            NLP Model
          </button>
          <button
            onClick={() => setTab('console')}
            className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
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
            ? 'Updating model + product…'
            : payload
              ? `${payload.mode.replace('_', ' ')} · ${payload.budget_used}/${payload.budget} pts`
              : 'Run Python first'}
        </div>
      </div>

      {tab === 'console' && (
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
      )}

      {tab === 'model' && (
        <div className="flex-1 min-h-0 overflow-auto bg-[#090b10] p-4 text-white">
          <div className="mx-auto max-w-4xl space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                    Model Inspector
                  </div>
                  <h3 className="mt-1 text-lg font-bold">
                    {payload?.model?.name || 'Multinomial Naive Bayes'}
                  </h3>
                  <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">
                    The model reads each requirement as text and estimates the probability
                    that historical product decisions would label it HIGH, MEDIUM, or LOW.
                    The release planner then combines that learned signal with current
                    engineering evidence.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
                    <div className="text-[9px] uppercase text-slate-500">Validation accuracy</div>
                    <div className="mt-1 text-lg font-bold text-emerald-400">
                      {payload?.model ? `${(payload.model.accuracy * 100).toFixed(0)}%` : '—'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
                    <div className="text-[9px] uppercase text-slate-500">Macro F1</div>
                    <div className="mt-1 text-lg font-bold text-cyan-400">
                      {payload?.model ? payload.model.macro_f1.toFixed(2) : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {!payload ? (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center">
                <BrainCircuit className="mx-auto h-8 w-8 text-slate-600" />
                <div className="mt-3 text-sm font-semibold">Run Python to inspect the model</div>
                <div className="mt-1 text-xs text-slate-500">
                  The ranking, class probabilities, confidence, and evidence tokens
                  will appear here.
                </div>
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-2">
                  <div className="px-2 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Candidate requirements
                  </div>
                  <div className="space-y-1">
                    {payload.ranking.map((row, index) => (
                      <button
                        key={row.id}
                        onClick={() => setActiveRequirementId(row.id)}
                        className={`w-full rounded-lg border px-2.5 py-2 text-left transition ${
                          activeRequirement?.id === row.id
                            ? 'border-violet-500/60 bg-violet-500/10'
                            : 'border-transparent bg-slate-950/50 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-mono text-slate-500">#{index + 1} · {row.id}</span>
                          <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold ${
                            row.predicted_priority === 'HIGH'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : row.predicted_priority === 'MEDIUM'
                                ? 'bg-amber-500/15 text-amber-300'
                                : 'bg-slate-700 text-slate-300'
                          }`}>
                            {row.predicted_priority}
                          </span>
                        </div>
                        <div className="mt-1 text-[11px] font-semibold text-white">
                          {row.title}
                        </div>
                        <div className="mt-1 text-[9px] text-slate-500">
                          priority score {row.score.toFixed(3)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {activeRequirement && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="max-w-xl">
                          <div className="text-[9px] font-mono text-slate-500">{activeRequirement.id}</div>
                          <h4 className="mt-1 text-base font-bold">{activeRequirement.title}</h4>
                          <p className="mt-1 text-xs leading-5 text-slate-400">
                            {activeRequirement.description}
                          </p>
                        </div>
                        <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-right">
                          <div className="text-[9px] uppercase text-violet-300">Confidence</div>
                          <div className="text-xl font-black text-violet-300">
                            {(activeRequirement.confidence * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        <ProbabilityBar label="HIGH" value={activeRequirement.p_high} tone="bg-emerald-500" />
                        <ProbabilityBar label="MEDIUM" value={activeRequirement.p_medium} tone="bg-amber-400" />
                        <ProbabilityBar label="LOW" value={activeRequirement.p_low} tone="bg-rose-500" />
                      </div>

                      <div className="mt-4">
                        <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Text evidence pushing toward HIGH
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {activeRequirement.evidence_tokens.length > 0 ? (
                            activeRequirement.evidence_tokens.map((token) => (
                              <span
                                key={token}
                                className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-mono text-emerald-300"
                              >
                                {token}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-500">
                              No strongly positive HIGH-priority tokens for this requirement.
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {[
                          ['Votes', String(activeRequirement.user_votes)],
                          ['Business', `${activeRequirement.business_value}/10`],
                          ['Strategic', `${activeRequirement.strategic_fit}/10`],
                          ['Effort', `${activeRequirement.effort} pts`],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-lg bg-slate-950 px-3 py-2">
                            <div className="text-[8px] uppercase text-slate-600">{label}</div>
                            <div className="mt-0.5 text-sm font-bold text-slate-200">{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-400" />
                <div>
                  <div className="text-sm font-bold">Live NLP Playground</div>
                  <div className="text-[10px] text-slate-400">
                    Type a new software requirement. This calls the same Python model used by the lab.
                  </div>
                </div>
              </div>

              <textarea
                value={playgroundText}
                onChange={(event) => setPlaygroundText(event.target.value)}
                rows={3}
                className="mt-3 w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs leading-5 text-white outline-none focus:border-cyan-500"
              />

              <div className="mt-2 flex items-center justify-between gap-3">
                <button
                  onClick={handleAnalyze}
                  disabled={!onAnalyzeRequirement || isAnalyzing || isRunning}
                  className="rounded-md bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isAnalyzing ? 'Running model…' : 'Analyse Requirement'}
                </button>
                {analysisError && (
                  <span className="text-[10px] text-rose-400">{analysisError}</span>
                )}
              </div>

              {playgroundPrediction && (
                <div className="mt-3 grid gap-3 rounded-lg border border-slate-800 bg-slate-950/80 p-3 sm:grid-cols-[140px_minmax(0,1fr)]">
                  <div>
                    <div className="text-[8px] uppercase text-slate-500">Prediction</div>
                    <div className="mt-1 text-xl font-black text-cyan-300">
                      {playgroundPrediction.label}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">
                      confidence {(playgroundPrediction.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="space-y-2">
                    <ProbabilityBar label="HIGH" value={playgroundPrediction.p_high} tone="bg-emerald-500" />
                    <ProbabilityBar label="MEDIUM" value={playgroundPrediction.p_medium} tone="bg-amber-400" />
                    <ProbabilityBar label="LOW" value={playgroundPrediction.p_low} tone="bg-rose-500" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'preview' && (
        <div className="flex-1 min-h-0 overflow-auto bg-[#030303] p-3">
          <div className="mx-auto min-h-full max-w-5xl overflow-hidden rounded-xl border border-zinc-800 bg-[#121212] text-white shadow-2xl">
            <div className="flex h-9 items-center justify-between border-b border-white/5 bg-[#090909] px-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/90" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/90" />
              </div>
              <div className="flex items-center gap-2">
                {payload && (
                  <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${
                    payload.mode === 'AI_ASSISTED'
                      ? 'bg-violet-500/15 text-violet-300'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}>
                    {payload.mode.replace('_', ' ')}
                  </span>
                )}
                {hasDataSaver && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-400/10 px-2 py-0.5 text-[8px] font-semibold text-sky-300">
                    <WifiOff className="h-2.5 w-2.5" />
                    Data Saver
                  </span>
                )}
                <span className="text-[8px] text-zinc-600">Interactive teaching mockup</span>
              </div>
            </div>

            <div className="grid min-h-[500px] grid-cols-[60px_minmax(0,1fr)_190px]">
              <aside className="flex flex-col items-center gap-5 border-r border-white/5 bg-[#090909] py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1ed760] text-black">
                  <AudioLines className="h-4 w-4" />
                </div>
                {[
                  ['home', Home],
                  ['search', Search],
                  ['library', Library],
                ].map(([key, Icon]) => (
                  <button
                    key={key as string}
                    onClick={() => setActiveNav(key as 'home' | 'search' | 'library')}
                    className={`rounded-lg p-2 transition ${
                      activeNav === key
                        ? 'bg-white/10 text-white'
                        : 'text-zinc-500 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
                <div className="h-px w-6 bg-zinc-800" />
                <Heart className="h-4 w-4 text-zinc-500" />
                <ListMusic className="h-4 w-4 text-zinc-500" />
              </aside>

              <main className="min-w-0 bg-gradient-to-b from-[#233229] via-[#181818] to-[#121212] p-4">
                {activeNav === 'search' ? (
                  <div>
                    <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-black">
                      <Search className="h-4 w-4" />
                      <input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="What do you want to play?"
                        className="w-full bg-transparent text-xs outline-none"
                      />
                    </div>
                    <h3 className="mt-5 text-lg font-bold">Search results</h3>
                    <div className="mt-3 space-y-2">
                      {filteredTracks.map((track) => {
                        const index = TRACKS.indexOf(track);
                        return (
                          <button
                            key={track.title}
                            onClick={() => chooseTrack(index)}
                            className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-white/10"
                          >
                            <div className={`h-10 w-10 rounded bg-gradient-to-br ${track.gradient}`} />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-xs font-semibold">{track.title}</div>
                              <div className="text-[9px] text-zinc-500">{track.artist}</div>
                            </div>
                            <Play className="h-4 w-4 text-zinc-400" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : activeNav === 'library' ? (
                  <div>
                    <h3 className="text-lg font-bold">Your Library</h3>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {TRACKS.map((track, index) => (
                        <button
                          key={track.title}
                          onClick={() => chooseTrack(index)}
                          className="rounded-lg bg-white/5 p-3 text-left transition hover:bg-white/10"
                        >
                          <div className={`aspect-square rounded-md bg-gradient-to-br ${track.gradient}`} />
                          <div className="mt-2 text-xs font-bold">{track.title}</div>
                          <div className="text-[9px] text-zinc-500">{track.artist}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <div className="text-[8px] font-black uppercase tracking-[0.2em] text-[#1ed760]">
                          Spotify-style release preview
                        </div>
                        <h3 className="mt-1 text-xl font-black tracking-tight">Good afternoon</h3>
                      </div>
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-[9px] font-bold">
                        K
                      </div>
                    </div>

                    {!payload && (
                      <div className="mb-4 rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-[10px] text-amber-200">
                        Run Python first. The selected software requirements will change this product.
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ['Liked Songs', 'from-purple-700 to-indigo-400'],
                        ['Discover Weekly', 'from-emerald-700 to-lime-400'],
                        ['Daily Mix 1', 'from-orange-600 to-pink-500'],
                        ['Release Radar', 'from-blue-700 to-cyan-400'],
                      ].map(([name, gradient], index) => (
                        <button
                          key={name}
                          onClick={() => chooseTrack(index)}
                          className="flex h-11 items-center gap-2 overflow-hidden rounded bg-white/10 text-left transition hover:bg-white/15"
                        >
                          <div className={`h-11 w-11 shrink-0 bg-gradient-to-br ${gradient}`} />
                          <span className="truncate text-[10px] font-bold">{name}</span>
                        </button>
                      ))}
                    </div>

                    {hasAiDj && (
                      <button
                        onClick={() => {
                          chooseTrack(3);
                          setIsPlaying(true);
                        }}
                        className="mt-4 flex w-full items-center gap-3 rounded-xl border border-[#1ed760]/20 bg-gradient-to-r from-[#1ed760]/20 via-[#153f2a] to-[#243329] p-3 text-left transition hover:border-[#1ed760]/50"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1ed760] text-black shadow-lg">
                          <Sparkles className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#1ed760]">
                            Prioritized feature
                          </div>
                          <div className="truncate text-sm font-black">AI DJ · Focus Flow</div>
                          <div className="text-[9px] text-zinc-300">Click to start a generated context mix</div>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1ed760] text-black">
                          <Play className="h-4 w-4 fill-current" />
                        </div>
                      </button>
                    )}

                    <div className="mt-5 flex items-center justify-between">
                      <h4 className="text-sm font-black">{hasConcerts ? 'Made for you + Live near you' : 'Made for you'}</h4>
                      <span className="text-[9px] font-bold text-zinc-400">Show all</span>
                    </div>

                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {TRACKS.map((track, index) => (
                        <button
                          key={track.title}
                          onClick={() => chooseTrack(index)}
                          className="group min-w-0 rounded-lg bg-white/5 p-2 text-left transition hover:bg-white/10"
                        >
                          <div className={`relative aspect-square overflow-hidden rounded-md bg-gradient-to-br ${track.gradient}`}>
                            <div className="absolute inset-0 bg-black/10" />
                            <div className="absolute bottom-2 left-2 text-[8px] font-black tracking-tight text-white">
                              {track.title.toUpperCase()}
                            </div>
                            <div className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#1ed760] text-black opacity-0 shadow-lg transition group-hover:opacity-100">
                              <Play className="h-3.5 w-3.5 fill-current" />
                            </div>
                          </div>
                          <div className="mt-2 truncate text-[9px] font-bold">{track.title}</div>
                          <div className="truncate text-[8px] text-zinc-500">
                            {index === 2 && hasConcerts ? 'Live event recommendations enabled' : track.artist}
                          </div>
                        </button>
                      ))}
                    </div>

                    {hasPodcastSummary && (
                      <button className="mt-4 flex w-full items-center gap-3 rounded-lg bg-white/5 p-3 text-left hover:bg-white/10">
                        <Podcast className="h-5 w-5 text-[#1ed760]" />
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-bold">AI podcast summary</div>
                          <div className="truncate text-[9px] text-zinc-400">
                            60-second summary and key moments available before playback
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-zinc-500" />
                      </button>
                    )}
                  </>
                )}
              </main>

              <aside className="border-l border-white/5 bg-[#101010] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black">Now playing</span>
                  <ChevronRight className="h-3 w-3 text-zinc-500" />
                </div>

                <button
                  onClick={() => setIsPlaying((value) => !value)}
                  className={`relative mt-3 aspect-square w-full overflow-hidden rounded-lg bg-gradient-to-br ${currentTrack.gradient}`}
                >
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition hover:opacity-100">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/70">
                      {isPlaying ? (
                        <Pause className="h-5 w-5 fill-current" />
                      ) : (
                        <Play className="h-5 w-5 fill-current" />
                      )}
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 text-[11px] font-black">
                    {currentTrack.title.toUpperCase()}
                  </div>
                </button>

                <div className="mt-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[11px] font-bold">{currentTrack.title}</div>
                    <div className="text-[9px] text-zinc-500">{currentTrack.artist}</div>
                  </div>
                  <button
                    onClick={() => setLiked((value) => !value)}
                    className={liked ? 'text-[#1ed760]' : 'text-zinc-500'}
                  >
                    <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {(hasLyricsTranslation || hasAccessibleLyrics) && (
                  <div className={`mt-4 rounded-lg border p-3 ${
                    hasAccessibleLyrics
                      ? 'border-white/25 bg-black text-white'
                      : 'border-zinc-800 bg-zinc-900'
                  }`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-black">Lyrics</span>
                      <div className="flex items-center gap-1">
                        {hasLyricsTranslation && (
                          <button
                            onClick={() => setShowTranslatedLyrics((value) => !value)}
                            className="inline-flex items-center gap-1 rounded-full bg-[#1ed760]/15 px-2 py-1 text-[7px] font-bold text-[#1ed760]"
                          >
                            <Languages className="h-2.5 w-2.5" />
                            {showTranslatedLyrics ? 'BM' : 'EN'}
                          </button>
                        )}
                        {hasAccessibleLyrics && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[7px] font-bold text-white">
                            <Accessibility className="h-2.5 w-2.5" />
                            A+
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`mt-2 leading-relaxed ${
                      hasAccessibleLyrics ? 'text-[12px] font-semibold' : 'text-[9px] text-zinc-300'
                    }`}>
                      {showTranslatedLyrics && hasLyricsTranslation ? (
                        <>
                          Lampu kota bergerak perlahan<br />
                          malam menjadi irama<br />
                          kita terus melangkah…
                        </>
                      ) : (
                        <>
                          City lights are moving slowly<br />
                          the night becomes a rhythm<br />
                          we keep moving on…
                        </>
                      )}
                    </div>
                  </div>
                )}

                {hasQueueVoting && (
                  <div className="mt-4">
                    <div className="flex items-center gap-1 text-[9px] font-black">
                      <Users className="h-3.5 w-3.5 text-[#1ed760]" />
                      Group queue voting
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {TRACKS.slice(0, 3).map((track, index) => (
                        <div
                          key={track.title}
                          className="flex items-center gap-2 rounded-md bg-white/5 px-2 py-1.5"
                        >
                          <button
                            onClick={() => chooseTrack(index)}
                            className="min-w-0 flex-1 truncate text-left text-[8px] text-zinc-300 hover:text-white"
                          >
                            {track.title}
                          </button>
                          <button
                            onClick={() =>
                              setQueueVotes((votes) => ({
                                ...votes,
                                [track.title]: (votes[track.title] || 0) + 1,
                              }))
                            }
                            className="inline-flex items-center gap-1 rounded bg-[#1ed760]/10 px-1.5 py-1 text-[7px] font-bold text-[#1ed760] hover:bg-[#1ed760]/20"
                          >
                            <ThumbsUp className="h-2.5 w-2.5" />
                            {queueVotes[track.title] || 0}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {hasConcerts && (
                  <button className="mt-4 flex w-full items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-2 text-left">
                    <Ticket className="h-4 w-4 text-rose-300" />
                    <div>
                      <div className="text-[8px] font-bold text-rose-200">Live near you</div>
                      <div className="text-[7px] text-rose-300/70">3 events matched to your artists</div>
                    </div>
                  </button>
                )}
              </aside>
            </div>

            <div className="grid h-20 grid-cols-[1fr_1.45fr_1fr] items-center gap-3 border-t border-white/5 bg-[#0b0b0b] px-4">
              <div className="flex min-w-0 items-center gap-2">
                <div className={`h-11 w-11 shrink-0 rounded bg-gradient-to-br ${currentTrack.gradient}`} />
                <div className="min-w-0">
                  <div className="truncate text-[10px] font-bold">{currentTrack.title}</div>
                  <div className="truncate text-[8px] text-zinc-500">{currentTrack.artist}</div>
                </div>
                <button
                  onClick={() => setLiked((value) => !value)}
                  className={liked ? 'text-[#1ed760]' : 'text-zinc-500'}
                >
                  <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div>
                <div className="flex items-center justify-center gap-4">
                  <button onClick={previousTrack} className="text-zinc-400 hover:text-white">
                    <SkipBack className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setIsPlaying((value) => !value)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition hover:scale-105"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4 fill-current" />
                    ) : (
                      <Play className="h-4 w-4 fill-current" />
                    )}
                  </button>
                  <button onClick={nextTrack} className="text-zinc-400 hover:text-white">
                    <SkipForward className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-2 flex items-center gap-2 text-[7px] text-zinc-500">
                  <span>{formatTime(progress)}</span>
                  <input
                    type="range"
                    min={0}
                    max={currentTrack.duration}
                    value={progress}
                    onChange={(event) => setProgress(Number(event.target.value))}
                    className="h-1 flex-1 accent-white"
                  />
                  <span>{formatTime(currentTrack.duration)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 text-zinc-400">
                {hasLossless && (
                  <span className="rounded border border-[#1ed760]/40 px-2 py-1 text-[7px] font-black text-[#1ed760]">
                    LOSSLESS
                  </span>
                )}
                {hasDataSaver && (
                  <span className="rounded border border-sky-400/30 px-2 py-1 text-[7px] font-black text-sky-300">
                    DATA SAVER
                  </span>
                )}
                <Volume2 className="h-3.5 w-3.5" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  className="w-16 accent-white"
                />
              </div>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
              Release features
            </span>
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
                No release plan loaded yet.
              </span>
            )}
          </div>

          <div className="mt-2 rounded-lg border border-zinc-900 bg-zinc-950 px-3 py-2 text-[9px] leading-4 text-zinc-500">
            Audio in this teaching mockup is generated locally with the browser Web Audio API.
            It does not stream or reproduce Spotify catalogue music.
          </div>
        </div>
      )}
    </div>
  );
};
