import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Accessibility,
  AudioLines,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Database,
  Heart,
  Home,
  Languages,
  Library,
  ListMusic,
  Music2,
  Network,
  Pause,
  Play,
  Podcast,
  Search,
  ShieldCheck,
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

interface MatchRow {
  id: string;
  title: string;
  similarity: number;
}

export interface FeedbackMatchPrediction {
  matches: MatchRow[];
}

interface SelectedRequirement {
  id: string;
  title: string;
  visual_feature: string;
  engineering_days: number;
  score: number;
}

interface RankingRow {
  id: string;
  title: string;
  description: string;
  visual_feature: string;
  engineering_days: number;
  affected_mau?: number;
  support_tickets_90d?: number;
  feedback_mentions_90d?: number;
  mean_feedback_severity?: number;
  ship_probability?: number;
  prerequisite?: string;
  feedback_examples?: Array<{
    feedback_id: string;
    text: string;
    severity: number;
    similarity: number;
    channel: string;
    region: string;
  }>;
  baseline_value?: number;
}

interface ModelBenchmark {
  macro_f1_mean: number;
  macro_f1_std: number;
  accuracy_mean: number;
}

interface AnalysisPayload {
  mode: 'ANALYZE';
  data: {
    feedback_rows: number;
    historical_rows: number;
    candidate_rows: number;
  };
  threshold_sweep: Array<{
    threshold: number;
    accuracy: number;
    audited_count: number;
    assigned_count: number;
    coverage: number;
  }>;
  benchmarks: Record<string, ModelBenchmark>;
}

interface PreviewPayload {
  mode: 'BASELINE' | 'AI_ASSISTED';
  budget: number;
  budget_used: number;
  data: {
    feedback_rows: number;
    historical_rows: number;
    candidate_rows: number;
    audited_feedback_rows?: number;
  };
  nlp?: {
    method: string;
    threshold: number;
    audited_accuracy: number;
  };
  model?: {
    kind: string;
    features: string[];
    benchmarks: Record<string, ModelBenchmark>;
    training_fit: {
      accuracy: number;
      macro_f1: number;
    };
    feature_importance: Array<{
      feature: string;
      importance: number;
    }>;
  };
  selected: SelectedRequirement[];
  ranking: RankingRow[];
}

interface Lab02ProductPreviewPanelProps {
  result: ExecutionResult | null;
  isRunning: boolean;
  onClearConsole: () => void;
  onRestartRuntime: () => void;
  onAddOutputToReport: (output: string) => void;
  onAddPlotToReport: (plotBase64: string, caption?: string) => void;
  onAnalyzeRequirement?: (text: string) => Promise<FeedbackMatchPrediction>;
}

const parseMarker = <T,>(stdout: string | undefined, marker: string): T | null => {
  if (!stdout) return null;
  const line = stdout
    .split('\n')
    .reverse()
    .find((item) => item.startsWith(marker));

  if (!line) return null;

  try {
    return JSON.parse(line.slice(marker.length)) as T;
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

const prettyFeature = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatCompact = (value?: number) => {
  if (value === undefined) return '—';
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
};

const formatTime = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  return `${minutes}:${String(safe % 60).padStart(2, '0')}`;
};

const MetricCard: React.FC<{
  label: string;
  value: string;
  note?: string;
}> = ({ label, value, note }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
    <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">
      {label}
    </div>
    <div className="mt-1 text-xl font-black text-white">{value}</div>
    {note && <div className="mt-1 text-[9px] leading-4 text-slate-500">{note}</div>}
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
  const [tab, setTab] = useState<'product' | 'evidence' | 'model' | 'console'>('product');
  const preview = useMemo(
    () => parseMarker<PreviewPayload>(result?.stdout, '__AISE_PREVIEW__ '),
    [result?.stdout]
  );
  const analysis = useMemo(
    () => parseMarker<AnalysisPayload>(result?.stdout, '__AISE_ANALYSIS__ '),
    [result?.stdout]
  );

  const selectedFeatures = useMemo(
    () => new Set(preview?.selected.map((item) => item.visual_feature) || []),
    [preview]
  );

  const [activeRequirementId, setActiveRequirementId] = useState('');
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.55);
  const [liked, setLiked] = useState(false);
  const [activeNav, setActiveNav] = useState<'home' | 'search' | 'library'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTranslatedLyrics, setShowTranslatedLyrics] = useState(true);
  const [explicitBlocked, setExplicitBlocked] = useState(true);
  const [queueVotes, setQueueVotes] = useState<Record<string, number>>({
    'Neon Skyline': 18,
    'Night Drive': 12,
    'Sunset Loop': 9,
  });

  const [feedbackText, setFeedbackText] = useState(
    'Music keeps stopping when I lose mobile signal on the train.'
  );
  const [feedbackPrediction, setFeedbackPrediction] =
    useState<FeedbackMatchPrediction | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const synthIntervalRef = useRef<number | null>(null);
  const noteIndexRef = useRef(0);

  const currentTrack = TRACKS[currentTrackIndex];

  const activeRequirement = useMemo(() => {
    if (!preview?.ranking.length) return null;
    return (
      preview.ranking.find((row) => row.id === activeRequirementId) ||
      preview.ranking[0]
    );
  }, [preview, activeRequirementId]);

  useEffect(() => {
    if (preview?.ranking.length && !activeRequirementId) {
      setActiveRequirementId(preview.ranking[0].id);
    }
  }, [preview, activeRequirementId]);

  const has = (feature: string) => selectedFeatures.has(feature);

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

  const filteredTracks = TRACKS.filter((track) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      track.title.toLowerCase().includes(query) ||
      track.artist.toLowerCase().includes(query)
    );
  });

  const handleFeedbackMatch = async () => {
    if (!onAnalyzeRequirement || !feedbackText.trim()) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const prediction = await onAnalyzeRequirement(feedbackText.trim());
      setFeedbackPrediction(prediction);
    } catch (error: any) {
      setAnalysisError(error?.message || 'Unable to run TF-IDF matching.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const dataset = preview?.data || analysis?.data;
  const benchmarks = preview?.model?.benchmarks || analysis?.benchmarks;

  return (
    <div className="h-full flex flex-col bg-slate-950">
      <div className="h-10 shrink-0 border-b border-slate-800 bg-slate-900 px-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {([
            { id: 'product' as const, label: 'Live Product', Icon: Music2 },
            { id: 'evidence' as const, label: 'Data & NLP', Icon: Database },
            { id: 'model' as const, label: 'ML Model', Icon: BrainCircuit },
            { id: 'console' as const, label: 'Console', Icon: Terminal },
          ]).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-2 py-1.5 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-colors ${
                tab === id
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${id === 'product' ? 'text-[#1ed760]' : id === 'evidence' ? 'text-cyan-400' : id === 'model' ? 'text-violet-400' : ''}`} />
              {label}
            </button>
          ))}
        </div>
        <div className="text-[9px] text-slate-500 font-mono">
          {isRunning
            ? 'Running Python + scikit-learn…'
            : preview
              ? `${preview.mode.replace('_', ' ')} · ${preview.budget_used}/${preview.budget} days`
              : analysis
                ? 'ANALYZE mode'
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

      {tab === 'evidence' && (
        <div className="flex-1 min-h-0 overflow-auto bg-[#080b10] p-4 text-white">
          <div className="mx-auto max-w-5xl space-y-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400">
                Raw Evidence → NLP Evidence
              </div>
              <h3 className="mt-1 text-lg font-black">Customer-feedback pipeline</h3>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-400">
                The lab does not invent business-value scores. It starts from customer feedback,
                product telemetry, support pressure, engineering estimates, dependencies and
                historical release decisions.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <MetricCard
                label="Customer feedback"
                value={dataset ? String(dataset.feedback_rows) : '—'}
                note="unstructured records"
              />
              <MetricCard
                label="Historical releases"
                value={dataset ? String(dataset.historical_rows) : '—'}
                note="supervised training rows"
              />
              <MetricCard
                label="Current backlog"
                value={dataset ? String(dataset.candidate_rows) : '—'}
                note="candidate requirements"
              />
            </div>

            <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-cyan-400" />
                <div>
                  <div className="text-sm font-bold">Live feedback matcher</div>
                  <div className="text-[10px] text-slate-400">
                    This runs the same scikit-learn TF-IDF vectorizer and cosine-similarity
                    matcher used on the full customer-feedback corpus.
                  </div>
                </div>
              </div>

              <textarea
                value={feedbackText}
                onChange={(event) => setFeedbackText(event.target.value)}
                rows={3}
                className="mt-3 w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs leading-5 text-white outline-none focus:border-cyan-500"
              />

              <div className="mt-2 flex items-center gap-3">
                <button
                  onClick={handleFeedbackMatch}
                  disabled={!onAnalyzeRequirement || isAnalyzing || isRunning}
                  className="rounded-md bg-cyan-400 px-3 py-2 text-xs font-black text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
                >
                  {isAnalyzing ? 'Vectorizing…' : 'Match Feedback'}
                </button>
                {analysisError && (
                  <span className="text-[10px] text-rose-400">{analysisError}</span>
                )}
              </div>

              {feedbackPrediction && (
                <div className="mt-3 space-y-2">
                  {feedbackPrediction.matches.map((match, index) => (
                    <div
                      key={match.id}
                      className="rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <span className="mr-2 text-[9px] font-mono text-slate-600">#{index + 1}</span>
                          <span className="text-xs font-semibold">{match.title}</span>
                        </div>
                        <span className="font-mono text-[10px] text-cyan-300">
                          cosine {match.similarity.toFixed(3)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-cyan-400"
                          style={{ width: `${Math.min(100, match.similarity * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {analysis?.threshold_sweep && (
              <section className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800">
                  <div className="text-sm font-bold">Audited threshold sweep</div>
                  <div className="text-[10px] text-slate-400">
                    Use the analyst-labelled subset to choose a defensible similarity threshold.
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead className="bg-slate-950 text-slate-500">
                      <tr>
                        <th className="px-3 py-2 text-left">Threshold</th>
                        <th className="px-3 py-2 text-left">Audited accuracy</th>
                        <th className="px-3 py-2 text-left">Coverage</th>
                        <th className="px-3 py-2 text-left">Assigned</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {analysis.threshold_sweep.map((row) => (
                        <tr key={row.threshold}>
                          <td className="px-3 py-2 font-mono">{row.threshold.toFixed(2)}</td>
                          <td className="px-3 py-2">{(row.accuracy * 100).toFixed(1)}%</td>
                          <td className="px-3 py-2">{(row.coverage * 100).toFixed(1)}%</td>
                          <td className="px-3 py-2">{row.assigned_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {preview?.nlp && (
              <section className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <MetricCard label="NLP method" value="TF-IDF" note="1–2 grams + cosine similarity" />
                  <MetricCard label="Chosen threshold" value={preview.nlp.threshold.toFixed(2)} />
                  <MetricCard
                    label="Audited accuracy"
                    value={`${(preview.nlp.audited_accuracy * 100).toFixed(1)}%`}
                    note={`${preview.data.audited_feedback_rows || 0} audited records`}
                  />
                </div>
              </section>
            )}

            {preview?.mode === 'AI_ASSISTED' && activeRequirement && (
              <section className="grid gap-4 xl:grid-cols-[230px_minmax(0,1fr)]">
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-2">
                  <div className="px-2 py-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Requirement evidence
                  </div>
                  {preview.ranking.map((row) => (
                    <button
                      key={row.id}
                      onClick={() => setActiveRequirementId(row.id)}
                      className={`mb-1 w-full rounded-lg border px-2.5 py-2 text-left ${
                        activeRequirement.id === row.id
                          ? 'border-cyan-500/50 bg-cyan-500/10'
                          : 'border-transparent bg-slate-950/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-[9px] font-mono text-slate-500">{row.id}</div>
                      <div className="mt-0.5 text-[11px] font-semibold">{row.title}</div>
                      <div className="mt-1 text-[9px] text-slate-500">
                        {row.feedback_mentions_90d ?? 0} matched feedback
                      </div>
                    </button>
                  ))}
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                  <h4 className="text-base font-black">{activeRequirement.title}</h4>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{activeRequirement.description}</p>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <MetricCard label="Matched feedback" value={String(activeRequirement.feedback_mentions_90d ?? 0)} />
                    <MetricCard label="Mean severity" value={(activeRequirement.mean_feedback_severity ?? 0).toFixed(2)} />
                    <MetricCard label="Support tickets" value={String(activeRequirement.support_tickets_90d ?? 0)} />
                    <MetricCard label="Affected MAU" value={formatCompact(activeRequirement.affected_mau)} />
                  </div>

                  <div className="mt-4">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Highest-similarity customer evidence
                    </div>
                    <div className="mt-2 space-y-2">
                      {(activeRequirement.feedback_examples || []).map((item) => (
                        <div key={item.feedback_id} className="rounded-lg bg-slate-950 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-mono text-[8px] text-slate-600">{item.feedback_id}</span>
                            <span className="text-[8px] text-cyan-400">
                              similarity {item.similarity.toFixed(3)} · severity {item.severity}/5
                            </span>
                          </div>
                          <div className="mt-1 text-[10px] leading-4 text-slate-300">{item.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      )}

      {tab === 'model' && (
        <div className="flex-1 min-h-0 overflow-auto bg-[#090b10] p-4 text-white">
          <div className="mx-auto max-w-5xl space-y-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                Historical Release Model
              </div>
              <h3 className="mt-1 text-lg font-black">Supervised prioritization</h3>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-400">
                Logistic Regression and Random Forest learn from historical release decisions.
                The output is P(SHIPPED_NEXT), not a manually weighted business score.
              </p>
            </div>

            {benchmarks ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(benchmarks).map(([kind, metric]) => (
                  <section
                    key={kind}
                    className={`rounded-xl border p-4 ${
                      preview?.model?.kind === kind
                        ? 'border-violet-500/50 bg-violet-500/10'
                        : 'border-slate-800 bg-slate-900/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-black">{prettyFeature(kind)}</div>
                      {preview?.model?.kind === kind && (
                        <span className="rounded-full bg-violet-400 px-2 py-0.5 text-[8px] font-black text-slate-950">
                          DEPLOYED
                        </span>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <MetricCard
                        label="5-fold macro-F1"
                        value={metric.macro_f1_mean.toFixed(3)}
                        note={`± ${metric.macro_f1_std.toFixed(3)}`}
                      />
                      <MetricCard
                        label="CV accuracy"
                        value={metric.accuracy_mean.toFixed(3)}
                      />
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-xs text-slate-500">
                Set <span className="font-mono text-slate-300">MODE = "ANALYZE"</span> and run Python to compare models.
              </div>
            )}

            {preview?.model && (
              <>
                <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-violet-400" />
                    <div className="text-sm font-black">Feature importance</div>
                  </div>
                  <div className="mt-3 space-y-2">
                    {preview.model.feature_importance.map((row) => (
                      <div key={row.feature} className="grid grid-cols-[180px_minmax(0,1fr)_46px] items-center gap-2">
                        <div className="truncate text-[10px] text-slate-300">{prettyFeature(row.feature)}</div>
                        <div className="h-2 rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-violet-400"
                            style={{ width: `${Math.max(2, row.importance * 100)}%` }}
                          />
                        </div>
                        <div className="text-right font-mono text-[9px] text-slate-500">
                          {(row.importance * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-black">Current backlog ranking</div>
                      <div className="text-[10px] text-slate-500">Predicted probability of SHIPPED_NEXT</div>
                    </div>
                    <div className="text-[9px] font-mono text-slate-500">
                      {preview.budget_used}/{preview.budget} engineer-days selected
                    </div>
                  </div>
                  <div className="divide-y divide-slate-800">
                    {preview.ranking.map((row, index) => {
                      const selected = preview.selected.some((item) => item.id === row.id);
                      return (
                        <button
                          key={row.id}
                          onClick={() => {
                            setActiveRequirementId(row.id);
                            setTab('evidence');
                          }}
                          className="grid w-full grid-cols-[32px_minmax(0,1fr)_90px_64px] items-center gap-3 px-4 py-3 text-left hover:bg-white/5"
                        >
                          <div className="text-[10px] font-mono text-slate-600">#{index + 1}</div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-[11px] font-bold">{row.title}</span>
                              {selected && (
                                <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[7px] font-black text-emerald-300">
                                  RELEASE
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 text-[8px] text-slate-500">
                              {row.feedback_mentions_90d} feedback · {formatCompact(row.affected_mau)} affected MAU
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[8px] text-slate-600">P(ship)</div>
                            <div className="font-mono text-[11px] font-bold text-violet-300">
                              {((row.ship_probability || 0) * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div className="text-right text-[9px] text-slate-500">
                            {row.engineering_days} d
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'product' && (
        <div className="flex-1 min-h-0 overflow-auto bg-[#030303] p-3">
          <div className="mx-auto min-h-full max-w-5xl overflow-hidden rounded-xl border border-zinc-800 bg-[#121212] text-white shadow-2xl">
            <div className="flex h-9 items-center justify-between border-b border-white/5 bg-[#090909] px-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/90" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/90" />
              </div>
              <div className="flex items-center gap-2">
                {preview && (
                  <span className={`rounded-full px-2 py-0.5 text-[8px] font-black ${
                    preview.mode === 'AI_ASSISTED'
                      ? 'bg-violet-500/15 text-violet-300'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}>
                    {preview.mode.replace('_', ' ')}
                  </span>
                )}
                {has('data_saver') && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-400/10 px-2 py-0.5 text-[8px] font-semibold text-sky-300">
                    <WifiOff className="h-2.5 w-2.5" />
                    Data Saver
                  </span>
                )}
                {has('offline_recovery') && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[8px] font-semibold text-emerald-300">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Recovery Ready
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
                {!preview && (
                  <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-[10px] text-amber-200">
                    Run <span className="font-mono">BASELINE</span> or <span className="font-mono">AI_ASSISTED</span> to load a release into the product.
                  </div>
                )}

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
                    <h3 className="mt-5 text-lg font-black">Search results</h3>
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
                    <h3 className="text-lg font-black">Your Library</h3>
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
                      <div className="flex items-center gap-1.5">
                        {has('context_service') && (
                          <span className="rounded-full bg-violet-400/10 px-2 py-1 text-[7px] font-bold text-violet-300">
                            Context Engine
                          </span>
                        )}
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-[9px] font-bold">
                          K
                        </div>
                      </div>
                    </div>

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

                    {has('ai_dj') && (
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
                            Released capability
                          </div>
                          <div className="truncate text-sm font-black">AI DJ · Focus Flow</div>
                          <div className="text-[9px] text-zinc-300">Context-aware generated listening session</div>
                        </div>
                        <Play className="h-5 w-5 text-[#1ed760]" />
                      </button>
                    )}

                    <div className="mt-5 flex items-center justify-between">
                      <h4 className="text-sm font-black">
                        {has('concerts') ? 'Made for you + Live near you' : 'Made for you'}
                      </h4>
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
                            <div className="absolute bottom-2 left-2 text-[8px] font-black">
                              {track.title.toUpperCase()}
                            </div>
                            <div className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#1ed760] text-black opacity-0 transition group-hover:opacity-100">
                              <Play className="h-3.5 w-3.5 fill-current" />
                            </div>
                          </div>
                          <div className="mt-2 truncate text-[9px] font-bold">{track.title}</div>
                          <div className="truncate text-[8px] text-zinc-500">{track.artist}</div>
                        </button>
                      ))}
                    </div>

                    {has('concerts') && (
                      <button className="mt-4 flex w-full items-center gap-3 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-left">
                        <Ticket className="h-5 w-5 text-rose-300" />
                        <div className="flex-1">
                          <div className="text-[10px] font-bold text-rose-200">3 concerts near you</div>
                          <div className="text-[9px] text-rose-300/70">Matched from artists in your recent listening</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-rose-300" />
                      </button>
                    )}

                    {has('podcast_summary') && (
                      <button className="mt-3 flex w-full items-center gap-3 rounded-lg bg-white/5 p-3 text-left hover:bg-white/10">
                        <Podcast className="h-5 w-5 text-[#1ed760]" />
                        <div className="flex-1">
                          <div className="text-[10px] font-bold">AI podcast summary</div>
                          <div className="text-[9px] text-zinc-400">60-second summary and key moments available</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-zinc-500" />
                      </button>
                    )}

                    {has('family_controls') && (
                      <div className="mt-3 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-blue-300" />
                            <div>
                              <div className="text-[10px] font-bold">Family content controls</div>
                              <div className="text-[8px] text-blue-200/70">Explicit content policy</div>
                            </div>
                          </div>
                          <button
                            onClick={() => setExplicitBlocked((value) => !value)}
                            className={`rounded-full px-2 py-1 text-[8px] font-bold ${
                              explicitBlocked
                                ? 'bg-blue-300 text-slate-950'
                                : 'bg-white/10 text-white'
                            }`}
                          >
                            {explicitBlocked ? 'Blocked' : 'Allowed'}
                          </button>
                        </div>
                      </div>
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
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition hover:opacity-100">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/70">
                      {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
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

                {(has('lyrics_translation') || has('accessible_lyrics')) && (
                  <div className={`mt-4 rounded-lg border p-3 ${
                    has('accessible_lyrics')
                      ? 'border-white/25 bg-black text-white'
                      : 'border-zinc-800 bg-zinc-900'
                  }`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-black">Lyrics</span>
                      <div className="flex items-center gap-1">
                        {has('lyrics_translation') && (
                          <button
                            onClick={() => setShowTranslatedLyrics((value) => !value)}
                            className="inline-flex items-center gap-1 rounded-full bg-[#1ed760]/15 px-2 py-1 text-[7px] font-bold text-[#1ed760]"
                          >
                            <Languages className="h-2.5 w-2.5" />
                            {showTranslatedLyrics ? 'BM' : 'EN'}
                          </button>
                        )}
                        {has('accessible_lyrics') && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[7px] font-bold text-white">
                            <Accessibility className="h-2.5 w-2.5" />
                            A+
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`mt-2 leading-relaxed ${
                      has('accessible_lyrics') ? 'text-[12px] font-semibold' : 'text-[9px] text-zinc-300'
                    }`}>
                      {showTranslatedLyrics && has('lyrics_translation') ? (
                        <>Lampu kota bergerak perlahan<br />malam menjadi irama<br />kita terus melangkah…</>
                      ) : (
                        <>City lights are moving slowly<br />the night becomes a rhythm<br />we keep moving on…</>
                      )}
                    </div>
                  </div>
                )}

                {has('queue_voting') && (
                  <div className="mt-4">
                    <div className="flex items-center gap-1 text-[9px] font-black">
                      <Users className="h-3.5 w-3.5 text-[#1ed760]" />
                      Group queue voting
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {TRACKS.slice(0, 3).map((track, index) => (
                        <div key={track.title} className="flex items-center gap-2 rounded-md bg-white/5 px-2 py-1.5">
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
                            className="inline-flex items-center gap-1 rounded bg-[#1ed760]/10 px-1.5 py-1 text-[7px] font-bold text-[#1ed760]"
                          >
                            <ThumbsUp className="h-2.5 w-2.5" />
                            {queueVotes[track.title] || 0}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
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
                <button onClick={() => setLiked((value) => !value)} className={liked ? 'text-[#1ed760]' : 'text-zinc-500'}>
                  <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => {
                      chooseTrack((currentTrackIndex - 1 + TRACKS.length) % TRACKS.length);
                    }}
                    className="text-zinc-400 hover:text-white"
                  >
                    <SkipBack className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setIsPlaying((value) => !value)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition hover:scale-105"
                  >
                    {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
                  </button>
                  <button
                    onClick={() => {
                      chooseTrack((currentTrackIndex + 1) % TRACKS.length);
                    }}
                    className="text-zinc-400 hover:text-white"
                  >
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
                {has('lossless') && (
                  <span className="rounded border border-[#1ed760]/40 px-2 py-1 text-[7px] font-black text-[#1ed760]">
                    LOSSLESS
                  </span>
                )}
                {has('audio_pipeline') && (
                  <span className="rounded border border-violet-400/30 px-2 py-1 text-[7px] font-black text-violet-300">
                    ADAPTIVE CODEC
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

          {preview && (
            <div className="mt-2 rounded-xl border border-zinc-900 bg-zinc-950 p-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[8px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
                  Release selected by optimizer
                </span>
                {preview.selected.map((item) => (
                  <span
                    key={item.id}
                    className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-1 text-[8px] text-zinc-300"
                  >
                    {item.title} · {item.engineering_days}d
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-2 rounded-lg border border-zinc-900 bg-zinc-950 px-3 py-2 text-[8px] leading-4 text-zinc-600">
            Audio is generated locally with the browser Web Audio API. The product
            interface is a teaching mockup and does not use Spotify catalogue music or internal Spotify data.
          </div>
        </div>
      )}
    </div>
  );
};
