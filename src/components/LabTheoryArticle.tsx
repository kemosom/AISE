import {
  useState,
  useRef,
  useEffect,
  type FC,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
  type ReactNode,
} from 'react';
import {
  PenTool,
  Highlighter,
  Eraser,
  MessageSquarePlus,
  RotateCcw,
  RotateCw,
  Trash2,
  FileDown,
  Printer,
  ArrowRight,
  Clock,
  BookOpen,
  CheckCircle2,
  Layers,
  Copy,
  Check,
  MousePointer,
  HelpCircle,
  X,
  ExternalLink,
} from 'lucide-react';
import type { LabManifest } from '../../labs/types';
import { generateLabsheetDocx, type StickyNoteItem } from '../lib/reports/labsheet-docx';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface DrawingStroke {
  id: string;
  tool: 'pen' | 'highlighter';
  color: string;
  width: number;
  opacity: number;
  points: Array<{ x: number; y: number }>;
}

function renderMath(expression: string, displayMode = false) {
  return katex.renderToString(expression, {
    displayMode,
    throwOnError: false,
    strict: 'ignore',
    output: 'htmlAndMathml',
  });
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const tokens = text.split(/(\$[^$]+\$|\*\*[^*]+\*\*|\`[^\`]+\`|\*[^*]+\*)/g);

  return tokens
    .filter(Boolean)
    .map((token, index) => {
      if (token.startsWith('

interface LabTheoryArticleProps {
  manifest: LabManifest;
  studentName?: string;
  studentId?: string;
  onBeginLab: () => void;
}

export const LabTheoryArticle: FC<LabTheoryArticleProps> = ({
  manifest,
  studentName,
  studentId,
  onBeginLab,
}) => {
  // Reading Progress State (0 to 100%)
  const [scrollProgress, setScrollProgress] = useState(0);

  // Active Tool: 'read' | 'pen' | 'highlighter' | 'eraser' | 'note'
  const [activeTool, setActiveTool] = useState<'read' | 'pen' | 'highlighter' | 'eraser' | 'note'>('read');
  const [penColor, setPenColor] = useState('#2563eb'); // Blue ink
  const [penWidth, setPenWidth] = useState(3);
  const [highlighterColor, setHighlighterColor] = useState('rgba(250, 204, 21, 0.45)'); // Yellow

  // Strokes state
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [undoneStrokes, setUndoneStrokes] = useState<DrawingStroke[]>([]);
  const currentStrokeRef = useRef<DrawingStroke | null>(null);

  // Sticky Notes state
  const [notes, setNotes] = useState<StickyNoteItem[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // UI status
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);
  const [showToolbarHelp, setShowToolbarHelp] = useState(false);

  // Refs
  const articleRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load saved annotations for this lab
  useEffect(() => {
    try {
      const savedStrokes = localStorage.getItem(`lab_strokes_v2_${manifest.id}`);
      if (savedStrokes) setStrokes(JSON.parse(savedStrokes));

      const savedNotes = localStorage.getItem(`lab_notes_v2_${manifest.id}`);
      if (savedNotes) setNotes(JSON.parse(savedNotes));
    } catch {
      // ignore
    }
  }, [manifest.id]);

  // Persist strokes & notes
  useEffect(() => {
    try {
      localStorage.setItem(`lab_strokes_v2_${manifest.id}`, JSON.stringify(strokes));
    } catch {
      // ignore
    }
  }, [strokes, manifest.id]);

  useEffect(() => {
    try {
      localStorage.setItem(`lab_notes_v2_${manifest.id}`, JSON.stringify(notes));
    } catch {
      // ignore
    }
  }, [notes, manifest.id]);

  // Scroll Progress listener
  useEffect(() => {
    const handleScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const total = el.scrollHeight - el.clientHeight;
      if (total <= 0) {
        setScrollProgress(0);
        return;
      }
      const current = el.scrollTop;
      const pct = Math.min(100, Math.max(0, Math.round((current / total) * 100)));
      setScrollProgress(pct);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }
    return () => {
      if (container) container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Synchronize canvas size with article content dimensions
  useEffect(() => {
    const updateCanvasSize = () => {
      const article = articleRef.current;
      const canvas = canvasRef.current;
      if (!article || !canvas) return;

      const rect = article.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;
      const height = article.scrollHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        redrawCanvas();
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [strokes]);

  // Redraw canvas
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = stroke.opacity;
      ctx.stroke();
    }

    ctx.restore();
  };

  useEffect(() => {
    redrawCanvas();
  }, [strokes]);

  // Get pointer coordinates relative to article container
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const article = articleRef.current;
    if (!article) return { x: 0, y: 0 };
    const rect = article.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  // Drawing interactions
  const handlePointerDown = (clientX: number, clientY: number) => {
    if (activeTool === 'read') return;

    const coords = getCanvasCoords(clientX, clientY);

    if (activeTool === 'note') {
      const newNote: StickyNoteItem = {
        id: `note-${Date.now()}`,
        x: Math.max(10, Math.min(coords.x, 700)),
        y: coords.y,
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setNotes((prev) => [...prev, newNote]);
      setEditingNoteId(newNote.id);
      setActiveTool('read');
      return;
    }

    if (activeTool === 'eraser') {
      eraseStrokeAt(coords.x, coords.y);
      return;
    }

    // Pen or Highlighter
    const isHighlighter = activeTool === 'highlighter';
    const newStroke: DrawingStroke = {
      id: `stroke-${Date.now()}`,
      tool: activeTool,
      color: isHighlighter ? highlighterColor : penColor,
      width: isHighlighter ? 18 : penWidth,
      opacity: isHighlighter ? 0.45 : 1,
      points: [coords],
    };

    currentStrokeRef.current = newStroke;
    setStrokes((prev) => [...prev, newStroke]);
    setUndoneStrokes([]);
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (activeTool === 'read') return;

    const coords = getCanvasCoords(clientX, clientY);

    if (activeTool === 'eraser' && currentStrokeRef.current) {
      eraseStrokeAt(coords.x, coords.y);
      return;
    }

    if (currentStrokeRef.current) {
      currentStrokeRef.current.points.push(coords);
      setStrokes((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          ...currentStrokeRef.current!,
          points: [...currentStrokeRef.current!.points],
        };
        return next;
      });
    }
  };

  const handlePointerUp = () => {
    currentStrokeRef.current = null;
  };

  const eraseStrokeAt = (x: number, y: number) => {
    const threshold = 18;
    setStrokes((prev) =>
      prev.filter((stroke) => {
        const hit = stroke.points.some((p) => {
          const dx = p.x - x;
          const dy = p.y - y;
          return Math.sqrt(dx * dx + dy * dy) <= threshold;
        });
        return !hit;
      })
    );
  };

  // Undo / Redo
  const handleUndo = () => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    setStrokes((prev) => prev.slice(0, prev.length - 1));
    setUndoneStrokes((prev) => [...prev, last]);
  };

  const handleRedo = () => {
    if (undoneStrokes.length === 0) return;
    const last = undoneStrokes[undoneStrokes.length - 1];
    setUndoneStrokes((prev) => prev.slice(0, prev.length - 1));
    setStrokes((prev) => [...prev, last]);
  };

  const handleClearAll = () => {
    if (strokes.length === 0 && notes.length === 0) return;
    if (window.confirm('Clear all drawings and sticky notes on this lab sheet?')) {
      setStrokes([]);
      setUndoneStrokes([]);
      setNotes([]);
    }
  };

  // Export to Word (.docx)
  const handleExportDocx = async () => {
    setIsExportingDocx(true);
    try {
      let canvasImageBase64: string | null = null;
      if (canvasRef.current && strokes.length > 0) {
        canvasImageBase64 = canvasRef.current.toDataURL('image/png');
      }

      const blob = await generateLabsheetDocx({
        manifest,
        studentName,
        studentId,
        canvasImageBase64,
        notes,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanLabNum = String(manifest.labNumber).padStart(2, '0');
      a.download = `MAI5124_Lab${cleanLabNum}_Labsheet_Annotated.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Export as PDF via system print
  const handlePrintPdf = () => {
    window.print();
  };

  // Copy code snippet
  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIdx(idx);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  // Parse markdown into sections
  const markdownBlocks = manifest.instructionsMarkdown.split('\n\n');

  return (
    <div
      ref={containerRef}
      data-labsheet-print-root
      className="relative flex-1 bg-[#FAFAFA] overflow-y-auto text-slate-900 font-sans selection:bg-amber-100 selection:text-amber-900"
    >
      {/* 1. TOP READING PROGRESS BAR (MEDIUM STYLE) */}
      <div data-labsheet-no-print className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-200">
        <div
          className="h-full bg-blue-900 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* 2. STICKY FLOATING ANNOTATION TOOLBAR */}
      <aside data-labsheet-no-print aria-label="Annotation tools" className="sticky top-4 z-40 max-w-3xl mx-auto px-4 pointer-events-none mb-6">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl p-2 px-3 flex items-center justify-between pointer-events-auto gap-2">
          {/* Main Annotation Tools */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTool('read')}
              title="Reading & Select Mode (Pan & text selection)"
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTool === 'read'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MousePointer className="w-4 h-4" />
              <span className="hidden sm:inline">Read</span>
            </button>

            <button
              onClick={() => setActiveTool('pen')}
              title="Pen Tool (Draw, circle, underline)"
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTool === 'pen'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <PenTool className="w-4 h-4" />
              <span className="hidden sm:inline">Pen</span>
            </button>

            <button
              onClick={() => setActiveTool('highlighter')}
              title="Highlighter Tool (Translucent marker)"
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTool === 'highlighter'
                  ? 'bg-amber-400 text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Highlighter className="w-4 h-4" />
              <span className="hidden sm:inline">Highlight</span>
            </button>

            <button
              onClick={() => setActiveTool('eraser')}
              title="Eraser Tool (Click or drag over strokes)"
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTool === 'eraser'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Eraser className="w-4 h-4" />
              <span className="hidden sm:inline">Eraser</span>
            </button>

            <button
              onClick={() => setActiveTool('note')}
              title="Add Sticky Note (Click on sheet to drop a note)"
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTool === 'note'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span className="hidden sm:inline">Note</span>
              {notes.length > 0 && (
                <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {notes.length}
                </span>
              )}
            </button>
          </div>

          {/* Color Palettes when Pen or Highlighter is Active */}
          {activeTool === 'pen' && (
            <div className="flex items-center space-x-1 border-l border-slate-200 pl-2">
              {[
                { color: '#2563eb', label: 'Blue' },
                { color: '#dc2626', label: 'Red' },
                { color: '#059669', label: 'Green' },
                { color: '#18181b', label: 'Black' },
              ].map((c) => (
                <button
                  key={c.color}
                  onClick={() => setPenColor(c.color)}
                  aria-label={`Select ${c.label} pen color`}
                  className={`w-5 h-5 rounded-full border cursor-pointer transition-transform ${
                    penColor === c.color ? 'scale-125 ring-2 ring-blue-400 border-white' : 'border-slate-300'
                  }`}
                  style={{ backgroundColor: c.color }}
                />
              ))}
              <div className="flex items-center space-x-1 ml-1.5 pl-1.5 border-l border-slate-200">
                {[2, 4, 6].map((w) => (
                  <button
                    key={w}
                    onClick={() => setPenWidth(w)}
                    aria-label={`Set pen stroke width to ${w} pixels`}
                    className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold cursor-pointer ${
                      penWidth === w ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {w === 2 ? 'S' : w === 4 ? 'M' : 'L'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTool === 'highlighter' && (
            <div className="flex items-center space-x-1.5 border-l border-slate-200 pl-2">
              {[
                { color: 'rgba(250, 204, 21, 0.45)', bg: '#fde047', label: 'Yellow' },
                { color: 'rgba(74, 222, 128, 0.45)', bg: '#86efac', label: 'Green' },
                { color: 'rgba(244, 114, 182, 0.45)', bg: '#f472b6', label: 'Pink' },
              ].map((c) => (
                <button
                  key={c.color}
                  onClick={() => setHighlighterColor(c.color)}
                  aria-label={`Select ${c.label} highlighter`}
                  className={`w-5 h-5 rounded-full border cursor-pointer transition-transform ${
                    highlighterColor === c.color ? 'scale-125 ring-2 ring-amber-400 border-white' : 'border-slate-300'
                  }`}
                  style={{ backgroundColor: c.bg }}
                />
              ))}
            </div>
          )}

          {/* Action Tools: Undo, Redo, Clear, Exports & Begin Lab */}
          <div className="flex items-center space-x-1 border-l border-slate-200 pl-2">
            <button
              onClick={handleUndo}
              disabled={strokes.length === 0}
              title="Undo stroke"
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-30 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={undoneStrokes.length === 0}
              title="Redo stroke"
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-30 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleClearAll}
              disabled={strokes.length === 0 && notes.length === 0}
              title="Clear all annotations"
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg disabled:opacity-30 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Export Word (.docx) */}
            <button
              onClick={handleExportDocx}
              disabled={isExportingDocx}
              title="Export complete labsheet with drawings & notes as Word document"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl text-xs font-semibold cursor-pointer border border-blue-200 transition-all ml-1"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {isExportingDocx ? 'Exporting...' : 'Export Word'}
              </span>
            </button>

            {/* Export PDF */}
            <button
              onClick={handlePrintPdf}
              title="Export or print as PDF"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold cursor-pointer border border-slate-300 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden md:inline">PDF</span>
            </button>

          </div>
        </div>
      </aside>

      {/* 3. MAIN MEDIUM BLOG STYLE ARTICLE CONTAINER */}
      <article
        ref={articleRef}
        className="relative max-w-3xl mx-auto px-6 pt-6 pb-28 min-h-[90vh]"
      >
        {/* INTERACTIVE CANVAS OVERLAY (Pen & Highlighter Drawings) */}
        <canvas
          ref={canvasRef}
          className={`absolute top-0 left-0 w-full h-full z-20 ${
            activeTool === 'read'
              ? 'pointer-events-none'
              : activeTool === 'pen'
              ? 'cursor-crosshair pointer-events-auto'
              : activeTool === 'highlighter'
              ? 'cursor-cell pointer-events-auto'
              : activeTool === 'eraser'
              ? 'cursor-grab pointer-events-auto'
              : 'cursor-pointer pointer-events-auto'
          }`}
          onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
          onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
          onMouseUp={handlePointerUp}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            if (touch) handlePointerDown(touch.clientX, touch.clientY);
          }}
          onTouchMove={(e) => {
            const touch = e.touches[0];
            if (touch) handlePointerMove(touch.clientX, touch.clientY);
          }}
          onTouchEnd={handlePointerUp}
        />

        {/* STICKY NOTES PINNED OVERLAY */}
        {notes.map((note, idx) => (
          <div
            key={note.id}
            style={{ left: `${note.x}px`, top: `${note.y}px` }}
            className="absolute z-30 transform -translate-x-1/2 -translate-y-2 max-w-xs w-64 bg-amber-50/95 border border-amber-300 rounded-xl p-3 shadow-lg backdrop-blur-xs transition-all"
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 pb-1.5 mb-1.5 border-b border-amber-200">
              <span className="flex items-center gap-1">
                <span>📌 Note #{idx + 1}</span>
                <span className="text-[10px] text-amber-700 font-normal">({note.timestamp})</span>
              </span>
              <button
                onClick={() => setNotes((prev) => prev.filter((n) => n.id !== note.id))}
                className="text-amber-700 hover:text-rose-600 cursor-pointer"
                title="Delete note"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <textarea
              autoFocus={editingNoteId === note.id}
              value={note.text}
              onChange={(e) => {
                const val = e.target.value;
                setNotes((prev) =>
                  prev.map((n) => (n.id === note.id ? { ...n, text: val } : n))
                );
              }}
              onFocus={() => setEditingNoteId(note.id)}
              onBlur={() => setEditingNoteId(null)}
              placeholder="Type your notes, question for TA, or hypotheses here..."
              className="w-full text-xs text-amber-950 bg-transparent resize-y outline-none leading-relaxed min-h-[55px]"
            />
          </div>
        ))}

        {/* 4. EDITORIAL ARTICLE HEADER */}
        <header className="mb-10 pb-8 border-b border-slate-200/80">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wider uppercase text-blue-900 mb-3">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200">
              MAI5124 Laboratory Module
            </span>
            <span>•</span>
            <span className="text-slate-500 font-mono">Lab {String(manifest.labNumber).padStart(2, '0')}</span>
            <span>•</span>
            <span className="text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{manifest.estimatedDuration || '45 min read & practical'}</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-4">
            {manifest.title}
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed mb-6 font-serif">
            {manifest.shortDescription}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 pt-4 border-t border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center text-xs">
                SU
              </div>
              <div>
                <p className="font-semibold text-slate-900">Sunway University Computing</p>
                <p className="text-[11px] text-slate-500">
                  Artificial Intelligence in Software Engineering
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportDocx}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5 text-blue-900" />
                <span>Export Word (.docx)</span>
              </button>
              <button
                onClick={handlePrintPdf}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / PDF</span>
              </button>
            </div>
          </div>
        </header>

        {/* 5. TARGET COMPETENCIES & LEARNING OUTCOMES CARD */}
        {manifest.learningOutcomes && manifest.learningOutcomes.length > 0 && (
          <div className="my-8 p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-900 uppercase tracking-wider mb-3">
              <BookOpen className="w-4 h-4 text-blue-800" />
              <span>Target Engineering Competencies</span>
            </div>
            <ul className="space-y-2.5">
              {manifest.learningOutcomes.map((outcome, idx) => (
                <li key={idx} className="flex items-start space-x-3 text-sm text-slate-700 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 6. RICH ARTICLE BODY (EDITORIAL MEDIUM STYLE) */}
        <div className="space-y-6 text-[18px] text-slate-800 leading-[1.8] font-serif">
          {markdownBlocks.map((block, idx) => {
            const trimmed = block.trim();
            if (!trimmed) return null;

            // Display mathematics
            if (trimmed.startsWith('$') && trimmed.endsWith('$')) {
              const expression = trimmed.slice(2, -2).trim();
              return (
                <div
                  key={idx}
                  className="my-7 overflow-x-auto text-center text-[1.08em] text-slate-950"
                  dangerouslySetInnerHTML={{
                    __html: renderMath(expression, true),
                  }}
                />
              );
            }

            // Horizontal separator between theory and practical sheet
            if (trimmed === '---') {
              return <hr key={idx} className="my-12 border-0 border-t border-slate-300" />;
            }

            // Heading 1
            if (trimmed.startsWith('# ')) {
              return (
                <h2
                  key={idx}
                  className="font-sans text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-10 mb-4 pt-4 border-t border-slate-200/60"
                >
                  {trimmed.replace(/^# /, '')}
                </h2>
              );
            }

            // Heading 2 or 3
            if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
              return (
                <h3
                  key={idx}
                  className="font-sans text-lg sm:text-xl font-bold text-blue-950 uppercase tracking-wider mt-8 mb-3"
                >
                  {trimmed.replace(/^###? /, '')}
                </h3>
              );
            }

            // Code block
            if (trimmed.startsWith('```')) {
              const codeLines = trimmed.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '');
              return (
                <div key={idx} className="my-6 rounded-2xl overflow-hidden border border-slate-800/80 shadow-md font-sans">
                  <div className="bg-slate-900 px-4 py-2 flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 font-mono">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>Python Reference Specification</span>
                    </span>
                    <button
                      onClick={() => handleCopyCode(codeLines, idx)}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white cursor-pointer px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-all"
                    >
                      {copiedCodeIdx === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy code</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-950 text-slate-100 font-mono text-xs sm:text-[13px] overflow-x-auto leading-relaxed">
                    <code>{codeLines}</code>
                  </pre>
                </div>
              );
            }

            // Bullet list
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
              const items = trimmed.split('\n');
              return (
                <ul key={idx} className="my-4 space-y-2 list-none pl-2">
                  {items.map((item, itemIdx) => {
                    const clean = item.replace(/^[-*]\s+/, '').trim();
                    if (!clean) return null;
                    return (
                      <li key={itemIdx} className="flex items-start space-x-3 text-slate-700">
                        <span className="text-blue-600 font-bold text-lg leading-none mt-1">•</span>
                        <span>{renderInlineMarkdown(clean)}</span>
                      </li>
                    );
                  })}
                </ul>
              );
            }

            // Numbered list
            if (/^\d+\.\s/.test(trimmed)) {
              const items = trimmed.split('\n');
              return (
                <ol key={idx} className="my-4 space-y-2.5 pl-2">
                  {items.map((item, itemIdx) => {
                    const numMatch = item.match(/^(\d+)\.\s+(.*)$/);
                    if (!numMatch) return null;
                    return (
                      <li key={itemIdx} className="flex items-start space-x-3 text-slate-700">
                        <span className="font-sans font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 mt-0.5">
                          {numMatch[1]}
                        </span>
                        <span>{renderInlineMarkdown(numMatch[2])}</span>
                      </li>
                    );
                  })}
                </ol>
              );
            }

            // Blockquote
            if (trimmed.startsWith('>')) {
              const quoteContent = trimmed.replace(/^>\s*/, '');
              return (
                <blockquote
                  key={idx}
                  className="my-6 pl-5 border-l-4 border-blue-900 italic text-slate-700 font-serif text-[19px] leading-relaxed bg-blue-50/30 py-2 rounded-r-lg"
                >
                  {renderInlineMarkdown(quoteContent)}
                </blockquote>
              );
            }

            // Standard narrative paragraph
            return (
              <p key={idx} className="leading-[1.85] text-slate-800">
                {renderInlineMarkdown(trimmed)}
              </p>
            );
          })}
        </div>

        {/* 7. STARTER FILES & SPECIFICATIONS OVERVIEW */}
        {manifest.starterFiles && manifest.starterFiles.length > 0 && (
          <div className="my-10 p-6 bg-white rounded-2xl border border-slate-200 shadow-xs font-sans">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              <Layers className="w-4 h-4 text-blue-900" />
              <span>Workspace Starter Modules</span>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              When you begin the lab, the following files will be automatically loaded into your interactive coding environment:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {manifest.starterFiles.map((file, fIdx) => (
                <div
                  key={fIdx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between"
                >
                  <div className="flex items-center space-x-2 font-mono text-xs font-semibold text-slate-800">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>{file.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase mt-2 font-mono">
                    {file.language} file
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. BEGIN LAB: intentionally placed only after the reading/lab sheet */}
        <section data-labsheet-no-print className="mt-14 pt-8 border-t border-slate-200 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-900">
                Theory and lab sheet complete
              </p>
              <h3 className="mt-1 text-xl font-semibold text-slate-950">
                Continue to the practical workspace
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 max-w-xl">
                Implement the required b-threads, run the program, verify the public tests,
                complete the visual design, and add evidence to your report.
              </p>
            </div>
            <button
              type="button"
              onClick={onBeginLab}
              className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-md text-sm font-semibold transition-colors cursor-pointer"
            >
              Begin Lab
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </article>
    </div>
  );
};
) && token.endsWith('

interface LabTheoryArticleProps {
  manifest: LabManifest;
  studentName?: string;
  studentId?: string;
  onBeginLab: () => void;
}

export const LabTheoryArticle: FC<LabTheoryArticleProps> = ({
  manifest,
  studentName,
  studentId,
  onBeginLab,
}) => {
  // Reading Progress State (0 to 100%)
  const [scrollProgress, setScrollProgress] = useState(0);

  // Active Tool: 'read' | 'pen' | 'highlighter' | 'eraser' | 'note'
  const [activeTool, setActiveTool] = useState<'read' | 'pen' | 'highlighter' | 'eraser' | 'note'>('read');
  const [penColor, setPenColor] = useState('#2563eb'); // Blue ink
  const [penWidth, setPenWidth] = useState(3);
  const [highlighterColor, setHighlighterColor] = useState('rgba(250, 204, 21, 0.45)'); // Yellow

  // Strokes state
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [undoneStrokes, setUndoneStrokes] = useState<DrawingStroke[]>([]);
  const currentStrokeRef = useRef<DrawingStroke | null>(null);

  // Sticky Notes state
  const [notes, setNotes] = useState<StickyNoteItem[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // UI status
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);
  const [showToolbarHelp, setShowToolbarHelp] = useState(false);

  // Refs
  const articleRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load saved annotations for this lab
  useEffect(() => {
    try {
      const savedStrokes = localStorage.getItem(`lab_strokes_v2_${manifest.id}`);
      if (savedStrokes) setStrokes(JSON.parse(savedStrokes));

      const savedNotes = localStorage.getItem(`lab_notes_v2_${manifest.id}`);
      if (savedNotes) setNotes(JSON.parse(savedNotes));
    } catch {
      // ignore
    }
  }, [manifest.id]);

  // Persist strokes & notes
  useEffect(() => {
    try {
      localStorage.setItem(`lab_strokes_v2_${manifest.id}`, JSON.stringify(strokes));
    } catch {
      // ignore
    }
  }, [strokes, manifest.id]);

  useEffect(() => {
    try {
      localStorage.setItem(`lab_notes_v2_${manifest.id}`, JSON.stringify(notes));
    } catch {
      // ignore
    }
  }, [notes, manifest.id]);

  // Scroll Progress listener
  useEffect(() => {
    const handleScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const total = el.scrollHeight - el.clientHeight;
      if (total <= 0) {
        setScrollProgress(0);
        return;
      }
      const current = el.scrollTop;
      const pct = Math.min(100, Math.max(0, Math.round((current / total) * 100)));
      setScrollProgress(pct);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }
    return () => {
      if (container) container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Synchronize canvas size with article content dimensions
  useEffect(() => {
    const updateCanvasSize = () => {
      const article = articleRef.current;
      const canvas = canvasRef.current;
      if (!article || !canvas) return;

      const rect = article.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;
      const height = article.scrollHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        redrawCanvas();
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [strokes]);

  // Redraw canvas
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = stroke.opacity;
      ctx.stroke();
    }

    ctx.restore();
  };

  useEffect(() => {
    redrawCanvas();
  }, [strokes]);

  // Get pointer coordinates relative to article container
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const article = articleRef.current;
    if (!article) return { x: 0, y: 0 };
    const rect = article.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  // Drawing interactions
  const handlePointerDown = (clientX: number, clientY: number) => {
    if (activeTool === 'read') return;

    const coords = getCanvasCoords(clientX, clientY);

    if (activeTool === 'note') {
      const newNote: StickyNoteItem = {
        id: `note-${Date.now()}`,
        x: Math.max(10, Math.min(coords.x, 700)),
        y: coords.y,
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setNotes((prev) => [...prev, newNote]);
      setEditingNoteId(newNote.id);
      setActiveTool('read');
      return;
    }

    if (activeTool === 'eraser') {
      eraseStrokeAt(coords.x, coords.y);
      return;
    }

    // Pen or Highlighter
    const isHighlighter = activeTool === 'highlighter';
    const newStroke: DrawingStroke = {
      id: `stroke-${Date.now()}`,
      tool: activeTool,
      color: isHighlighter ? highlighterColor : penColor,
      width: isHighlighter ? 18 : penWidth,
      opacity: isHighlighter ? 0.45 : 1,
      points: [coords],
    };

    currentStrokeRef.current = newStroke;
    setStrokes((prev) => [...prev, newStroke]);
    setUndoneStrokes([]);
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (activeTool === 'read') return;

    const coords = getCanvasCoords(clientX, clientY);

    if (activeTool === 'eraser' && currentStrokeRef.current) {
      eraseStrokeAt(coords.x, coords.y);
      return;
    }

    if (currentStrokeRef.current) {
      currentStrokeRef.current.points.push(coords);
      setStrokes((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          ...currentStrokeRef.current!,
          points: [...currentStrokeRef.current!.points],
        };
        return next;
      });
    }
  };

  const handlePointerUp = () => {
    currentStrokeRef.current = null;
  };

  const eraseStrokeAt = (x: number, y: number) => {
    const threshold = 18;
    setStrokes((prev) =>
      prev.filter((stroke) => {
        const hit = stroke.points.some((p) => {
          const dx = p.x - x;
          const dy = p.y - y;
          return Math.sqrt(dx * dx + dy * dy) <= threshold;
        });
        return !hit;
      })
    );
  };

  // Undo / Redo
  const handleUndo = () => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    setStrokes((prev) => prev.slice(0, prev.length - 1));
    setUndoneStrokes((prev) => [...prev, last]);
  };

  const handleRedo = () => {
    if (undoneStrokes.length === 0) return;
    const last = undoneStrokes[undoneStrokes.length - 1];
    setUndoneStrokes((prev) => prev.slice(0, prev.length - 1));
    setStrokes((prev) => [...prev, last]);
  };

  const handleClearAll = () => {
    if (strokes.length === 0 && notes.length === 0) return;
    if (window.confirm('Clear all drawings and sticky notes on this lab sheet?')) {
      setStrokes([]);
      setUndoneStrokes([]);
      setNotes([]);
    }
  };

  // Export to Word (.docx)
  const handleExportDocx = async () => {
    setIsExportingDocx(true);
    try {
      let canvasImageBase64: string | null = null;
      if (canvasRef.current && strokes.length > 0) {
        canvasImageBase64 = canvasRef.current.toDataURL('image/png');
      }

      const blob = await generateLabsheetDocx({
        manifest,
        studentName,
        studentId,
        canvasImageBase64,
        notes,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanLabNum = String(manifest.labNumber).padStart(2, '0');
      a.download = `MAI5124_Lab${cleanLabNum}_Labsheet_Annotated.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Export as PDF via system print
  const handlePrintPdf = () => {
    window.print();
  };

  // Copy code snippet
  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIdx(idx);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  // Parse markdown into sections
  const markdownBlocks = manifest.instructionsMarkdown.split('\n\n');

  return (
    <div
      ref={containerRef}
      data-labsheet-print-root
      className="relative flex-1 bg-[#FAFAFA] overflow-y-auto text-slate-900 font-sans selection:bg-amber-100 selection:text-amber-900"
    >
      {/* 1. TOP READING PROGRESS BAR (MEDIUM STYLE) */}
      <div data-labsheet-no-print className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-200">
        <div
          className="h-full bg-blue-900 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* 2. STICKY FLOATING ANNOTATION TOOLBAR */}
      <aside data-labsheet-no-print aria-label="Annotation tools" className="sticky top-4 z-40 max-w-3xl mx-auto px-4 pointer-events-none mb-6">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl p-2 px-3 flex items-center justify-between pointer-events-auto gap-2">
          {/* Main Annotation Tools */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTool('read')}
              title="Reading & Select Mode (Pan & text selection)"
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTool === 'read'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MousePointer className="w-4 h-4" />
              <span className="hidden sm:inline">Read</span>
            </button>

            <button
              onClick={() => setActiveTool('pen')}
              title="Pen Tool (Draw, circle, underline)"
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTool === 'pen'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <PenTool className="w-4 h-4" />
              <span className="hidden sm:inline">Pen</span>
            </button>

            <button
              onClick={() => setActiveTool('highlighter')}
              title="Highlighter Tool (Translucent marker)"
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTool === 'highlighter'
                  ? 'bg-amber-400 text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Highlighter className="w-4 h-4" />
              <span className="hidden sm:inline">Highlight</span>
            </button>

            <button
              onClick={() => setActiveTool('eraser')}
              title="Eraser Tool (Click or drag over strokes)"
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTool === 'eraser'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Eraser className="w-4 h-4" />
              <span className="hidden sm:inline">Eraser</span>
            </button>

            <button
              onClick={() => setActiveTool('note')}
              title="Add Sticky Note (Click on sheet to drop a note)"
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTool === 'note'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span className="hidden sm:inline">Note</span>
              {notes.length > 0 && (
                <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {notes.length}
                </span>
              )}
            </button>
          </div>

          {/* Color Palettes when Pen or Highlighter is Active */}
          {activeTool === 'pen' && (
            <div className="flex items-center space-x-1 border-l border-slate-200 pl-2">
              {[
                { color: '#2563eb', label: 'Blue' },
                { color: '#dc2626', label: 'Red' },
                { color: '#059669', label: 'Green' },
                { color: '#18181b', label: 'Black' },
              ].map((c) => (
                <button
                  key={c.color}
                  onClick={() => setPenColor(c.color)}
                  aria-label={`Select ${c.label} pen color`}
                  className={`w-5 h-5 rounded-full border cursor-pointer transition-transform ${
                    penColor === c.color ? 'scale-125 ring-2 ring-blue-400 border-white' : 'border-slate-300'
                  }`}
                  style={{ backgroundColor: c.color }}
                />
              ))}
              <div className="flex items-center space-x-1 ml-1.5 pl-1.5 border-l border-slate-200">
                {[2, 4, 6].map((w) => (
                  <button
                    key={w}
                    onClick={() => setPenWidth(w)}
                    aria-label={`Set pen stroke width to ${w} pixels`}
                    className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold cursor-pointer ${
                      penWidth === w ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {w === 2 ? 'S' : w === 4 ? 'M' : 'L'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTool === 'highlighter' && (
            <div className="flex items-center space-x-1.5 border-l border-slate-200 pl-2">
              {[
                { color: 'rgba(250, 204, 21, 0.45)', bg: '#fde047', label: 'Yellow' },
                { color: 'rgba(74, 222, 128, 0.45)', bg: '#86efac', label: 'Green' },
                { color: 'rgba(244, 114, 182, 0.45)', bg: '#f472b6', label: 'Pink' },
              ].map((c) => (
                <button
                  key={c.color}
                  onClick={() => setHighlighterColor(c.color)}
                  aria-label={`Select ${c.label} highlighter`}
                  className={`w-5 h-5 rounded-full border cursor-pointer transition-transform ${
                    highlighterColor === c.color ? 'scale-125 ring-2 ring-amber-400 border-white' : 'border-slate-300'
                  }`}
                  style={{ backgroundColor: c.bg }}
                />
              ))}
            </div>
          )}

          {/* Action Tools: Undo, Redo, Clear, Exports & Begin Lab */}
          <div className="flex items-center space-x-1 border-l border-slate-200 pl-2">
            <button
              onClick={handleUndo}
              disabled={strokes.length === 0}
              title="Undo stroke"
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-30 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={undoneStrokes.length === 0}
              title="Redo stroke"
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-30 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleClearAll}
              disabled={strokes.length === 0 && notes.length === 0}
              title="Clear all annotations"
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg disabled:opacity-30 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Export Word (.docx) */}
            <button
              onClick={handleExportDocx}
              disabled={isExportingDocx}
              title="Export complete labsheet with drawings & notes as Word document"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl text-xs font-semibold cursor-pointer border border-blue-200 transition-all ml-1"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {isExportingDocx ? 'Exporting...' : 'Export Word'}
              </span>
            </button>

            {/* Export PDF */}
            <button
              onClick={handlePrintPdf}
              title="Export or print as PDF"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold cursor-pointer border border-slate-300 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden md:inline">PDF</span>
            </button>

          </div>
        </div>
      </aside>

      {/* 3. MAIN MEDIUM BLOG STYLE ARTICLE CONTAINER */}
      <article
        ref={articleRef}
        className="relative max-w-3xl mx-auto px-6 pt-6 pb-28 min-h-[90vh]"
      >
        {/* INTERACTIVE CANVAS OVERLAY (Pen & Highlighter Drawings) */}
        <canvas
          ref={canvasRef}
          className={`absolute top-0 left-0 w-full h-full z-20 ${
            activeTool === 'read'
              ? 'pointer-events-none'
              : activeTool === 'pen'
              ? 'cursor-crosshair pointer-events-auto'
              : activeTool === 'highlighter'
              ? 'cursor-cell pointer-events-auto'
              : activeTool === 'eraser'
              ? 'cursor-grab pointer-events-auto'
              : 'cursor-pointer pointer-events-auto'
          }`}
          onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
          onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
          onMouseUp={handlePointerUp}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            if (touch) handlePointerDown(touch.clientX, touch.clientY);
          }}
          onTouchMove={(e) => {
            const touch = e.touches[0];
            if (touch) handlePointerMove(touch.clientX, touch.clientY);
          }}
          onTouchEnd={handlePointerUp}
        />

        {/* STICKY NOTES PINNED OVERLAY */}
        {notes.map((note, idx) => (
          <div
            key={note.id}
            style={{ left: `${note.x}px`, top: `${note.y}px` }}
            className="absolute z-30 transform -translate-x-1/2 -translate-y-2 max-w-xs w-64 bg-amber-50/95 border border-amber-300 rounded-xl p-3 shadow-lg backdrop-blur-xs transition-all"
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 pb-1.5 mb-1.5 border-b border-amber-200">
              <span className="flex items-center gap-1">
                <span>📌 Note #{idx + 1}</span>
                <span className="text-[10px] text-amber-700 font-normal">({note.timestamp})</span>
              </span>
              <button
                onClick={() => setNotes((prev) => prev.filter((n) => n.id !== note.id))}
                className="text-amber-700 hover:text-rose-600 cursor-pointer"
                title="Delete note"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <textarea
              autoFocus={editingNoteId === note.id}
              value={note.text}
              onChange={(e) => {
                const val = e.target.value;
                setNotes((prev) =>
                  prev.map((n) => (n.id === note.id ? { ...n, text: val } : n))
                );
              }}
              onFocus={() => setEditingNoteId(note.id)}
              onBlur={() => setEditingNoteId(null)}
              placeholder="Type your notes, question for TA, or hypotheses here..."
              className="w-full text-xs text-amber-950 bg-transparent resize-y outline-none leading-relaxed min-h-[55px]"
            />
          </div>
        ))}

        {/* 4. EDITORIAL ARTICLE HEADER */}
        <header className="mb-10 pb-8 border-b border-slate-200/80">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wider uppercase text-blue-900 mb-3">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200">
              MAI5124 Laboratory Module
            </span>
            <span>•</span>
            <span className="text-slate-500 font-mono">Lab {String(manifest.labNumber).padStart(2, '0')}</span>
            <span>•</span>
            <span className="text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{manifest.estimatedDuration || '45 min read & practical'}</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-4">
            {manifest.title}
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed mb-6 font-serif">
            {manifest.shortDescription}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 pt-4 border-t border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center text-xs">
                SU
              </div>
              <div>
                <p className="font-semibold text-slate-900">Sunway University Computing</p>
                <p className="text-[11px] text-slate-500">
                  Artificial Intelligence in Software Engineering
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportDocx}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5 text-blue-900" />
                <span>Export Word (.docx)</span>
              </button>
              <button
                onClick={handlePrintPdf}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / PDF</span>
              </button>
            </div>
          </div>
        </header>

        {/* 5. TARGET COMPETENCIES & LEARNING OUTCOMES CARD */}
        {manifest.learningOutcomes && manifest.learningOutcomes.length > 0 && (
          <div className="my-8 p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-900 uppercase tracking-wider mb-3">
              <BookOpen className="w-4 h-4 text-blue-800" />
              <span>Target Engineering Competencies</span>
            </div>
            <ul className="space-y-2.5">
              {manifest.learningOutcomes.map((outcome, idx) => (
                <li key={idx} className="flex items-start space-x-3 text-sm text-slate-700 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 6. RICH ARTICLE BODY (EDITORIAL MEDIUM STYLE) */}
        <div className="space-y-6 text-[18px] text-slate-800 leading-[1.8] font-serif">
          {markdownBlocks.map((block, idx) => {
            const trimmed = block.trim();
            if (!trimmed) return null;

            // Horizontal separator between theory and practical sheet
            if (trimmed === '---') {
              return <hr key={idx} className="my-12 border-0 border-t border-slate-300" />;
            }

            // Heading 1
            if (trimmed.startsWith('# ')) {
              return (
                <h2
                  key={idx}
                  className="font-sans text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-10 mb-4 pt-4 border-t border-slate-200/60"
                >
                  {trimmed.replace(/^# /, '')}
                </h2>
              );
            }

            // Heading 2 or 3
            if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
              return (
                <h3
                  key={idx}
                  className="font-sans text-lg sm:text-xl font-bold text-blue-950 uppercase tracking-wider mt-8 mb-3"
                >
                  {trimmed.replace(/^###? /, '')}
                </h3>
              );
            }

            // Code block
            if (trimmed.startsWith('```')) {
              const codeLines = trimmed.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '');
              return (
                <div key={idx} className="my-6 rounded-2xl overflow-hidden border border-slate-800/80 shadow-md font-sans">
                  <div className="bg-slate-900 px-4 py-2 flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 font-mono">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>Python Reference Specification</span>
                    </span>
                    <button
                      onClick={() => handleCopyCode(codeLines, idx)}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white cursor-pointer px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-all"
                    >
                      {copiedCodeIdx === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy code</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-950 text-slate-100 font-mono text-xs sm:text-[13px] overflow-x-auto leading-relaxed">
                    <code>{codeLines}</code>
                  </pre>
                </div>
              );
            }

            // Bullet list
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
              const items = trimmed.split('\n');
              return (
                <ul key={idx} className="my-4 space-y-2 list-none pl-2">
                  {items.map((item, itemIdx) => {
                    const clean = item.replace(/^[-*]\s+/, '').trim();
                    if (!clean) return null;
                    return (
                      <li key={itemIdx} className="flex items-start space-x-3 text-slate-700">
                        <span className="text-blue-600 font-bold text-lg leading-none mt-1">•</span>
                        <span>{renderInlineMarkdown(clean)}</span>
                      </li>
                    );
                  })}
                </ul>
              );
            }

            // Numbered list
            if (/^\d+\.\s/.test(trimmed)) {
              const items = trimmed.split('\n');
              return (
                <ol key={idx} className="my-4 space-y-2.5 pl-2">
                  {items.map((item, itemIdx) => {
                    const numMatch = item.match(/^(\d+)\.\s+(.*)$/);
                    if (!numMatch) return null;
                    return (
                      <li key={itemIdx} className="flex items-start space-x-3 text-slate-700">
                        <span className="font-sans font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 mt-0.5">
                          {numMatch[1]}
                        </span>
                        <span>{renderInlineMarkdown(numMatch[2])}</span>
                      </li>
                    );
                  })}
                </ol>
              );
            }

            // Blockquote
            if (trimmed.startsWith('>')) {
              const quoteContent = trimmed.replace(/^>\s*/, '');
              return (
                <blockquote
                  key={idx}
                  className="my-6 pl-5 border-l-4 border-blue-900 italic text-slate-700 font-serif text-[19px] leading-relaxed bg-blue-50/30 py-2 rounded-r-lg"
                >
                  {renderInlineMarkdown(quoteContent)}
                </blockquote>
              );
            }

            // Standard narrative paragraph
            return (
              <p key={idx} className="leading-[1.85] text-slate-800">
                {renderInlineMarkdown(trimmed)}
              </p>
            );
          })}
        </div>

        {/* 7. STARTER FILES & SPECIFICATIONS OVERVIEW */}
        {manifest.starterFiles && manifest.starterFiles.length > 0 && (
          <div className="my-10 p-6 bg-white rounded-2xl border border-slate-200 shadow-xs font-sans">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              <Layers className="w-4 h-4 text-blue-900" />
              <span>Workspace Starter Modules</span>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              When you begin the lab, the following files will be automatically loaded into your interactive coding environment:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {manifest.starterFiles.map((file, fIdx) => (
                <div
                  key={fIdx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between"
                >
                  <div className="flex items-center space-x-2 font-mono text-xs font-semibold text-slate-800">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>{file.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase mt-2 font-mono">
                    {file.language} file
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. BEGIN LAB: intentionally placed only after the reading/lab sheet */}
        <section data-labsheet-no-print className="mt-14 pt-8 border-t border-slate-200 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-900">
                Theory and lab sheet complete
              </p>
              <h3 className="mt-1 text-xl font-semibold text-slate-950">
                Continue to the practical workspace
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 max-w-xl">
                Implement the required b-threads, run the program, verify the public tests,
                complete the visual design, and add evidence to your report.
              </p>
            </div>
            <button
              type="button"
              onClick={onBeginLab}
              className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-md text-sm font-semibold transition-colors cursor-pointer"
            >
              Begin Lab
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </article>
    </div>
  );
};
)) {
        return (
          <span
            key={index}
            className="aise-inline-math"
            dangerouslySetInnerHTML={{
              __html: renderMath(token.slice(1, -1), false),
            }}
          />
        );
      }

      if (token.startsWith('**') && token.endsWith('**')) {
        return (
          <strong key={index} className="font-semibold text-slate-950">
            {token.slice(2, -2)}
          </strong>
        );
      }

      if (token.startsWith('`') && token.endsWith('`')) {
        return (
          <code
            key={index}
            className="font-mono text-[0.9em] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded"
          >
            {token.slice(1, -1)}
          </code>
        );
      }

      if (token.startsWith('*') && token.endsWith('*')) {
        return <em key={index}>{token.slice(1, -1)}</em>;
      }

      return <span key={index}>{token}</span>;
    });
}

interface LabTheoryArticleProps {
  manifest: LabManifest;
  studentName?: string;
  studentId?: string;
  onBeginLab: () => void;
}

export const LabTheoryArticle: FC<LabTheoryArticleProps> = ({
  manifest,
  studentName,
  studentId,
  onBeginLab,
}) => {
  // Reading Progress State (0 to 100%)
  const [scrollProgress, setScrollProgress] = useState(0);

  // Active Tool: 'read' | 'pen' | 'highlighter' | 'eraser' | 'note'
  const [activeTool, setActiveTool] = useState<'read' | 'pen' | 'highlighter' | 'eraser' | 'note'>('read');
  const [penColor, setPenColor] = useState('#2563eb'); // Blue ink
  const [penWidth, setPenWidth] = useState(3);
  const [highlighterColor, setHighlighterColor] = useState('rgba(250, 204, 21, 0.45)'); // Yellow

  // Strokes state
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [undoneStrokes, setUndoneStrokes] = useState<DrawingStroke[]>([]);
  const currentStrokeRef = useRef<DrawingStroke | null>(null);

  // Sticky Notes state
  const [notes, setNotes] = useState<StickyNoteItem[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // UI status
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);
  const [showToolbarHelp, setShowToolbarHelp] = useState(false);

  // Refs
  const articleRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load saved annotations for this lab
  useEffect(() => {
    try {
      const savedStrokes = localStorage.getItem(`lab_strokes_v2_${manifest.id}`);
      if (savedStrokes) setStrokes(JSON.parse(savedStrokes));

      const savedNotes = localStorage.getItem(`lab_notes_v2_${manifest.id}`);
      if (savedNotes) setNotes(JSON.parse(savedNotes));
    } catch {
      // ignore
    }
  }, [manifest.id]);

  // Persist strokes & notes
  useEffect(() => {
    try {
      localStorage.setItem(`lab_strokes_v2_${manifest.id}`, JSON.stringify(strokes));
    } catch {
      // ignore
    }
  }, [strokes, manifest.id]);

  useEffect(() => {
    try {
      localStorage.setItem(`lab_notes_v2_${manifest.id}`, JSON.stringify(notes));
    } catch {
      // ignore
    }
  }, [notes, manifest.id]);

  // Scroll Progress listener
  useEffect(() => {
    const handleScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const total = el.scrollHeight - el.clientHeight;
      if (total <= 0) {
        setScrollProgress(0);
        return;
      }
      const current = el.scrollTop;
      const pct = Math.min(100, Math.max(0, Math.round((current / total) * 100)));
      setScrollProgress(pct);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }
    return () => {
      if (container) container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Synchronize canvas size with article content dimensions
  useEffect(() => {
    const updateCanvasSize = () => {
      const article = articleRef.current;
      const canvas = canvasRef.current;
      if (!article || !canvas) return;

      const rect = article.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;
      const height = article.scrollHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        redrawCanvas();
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [strokes]);

  // Redraw canvas
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = stroke.opacity;
      ctx.stroke();
    }

    ctx.restore();
  };

  useEffect(() => {
    redrawCanvas();
  }, [strokes]);

  // Get pointer coordinates relative to article container
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const article = articleRef.current;
    if (!article) return { x: 0, y: 0 };
    const rect = article.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  // Drawing interactions
  const handlePointerDown = (clientX: number, clientY: number) => {
    if (activeTool === 'read') return;

    const coords = getCanvasCoords(clientX, clientY);

    if (activeTool === 'note') {
      const newNote: StickyNoteItem = {
        id: `note-${Date.now()}`,
        x: Math.max(10, Math.min(coords.x, 700)),
        y: coords.y,
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setNotes((prev) => [...prev, newNote]);
      setEditingNoteId(newNote.id);
      setActiveTool('read');
      return;
    }

    if (activeTool === 'eraser') {
      eraseStrokeAt(coords.x, coords.y);
      return;
    }

    // Pen or Highlighter
    const isHighlighter = activeTool === 'highlighter';
    const newStroke: DrawingStroke = {
      id: `stroke-${Date.now()}`,
      tool: activeTool,
      color: isHighlighter ? highlighterColor : penColor,
      width: isHighlighter ? 18 : penWidth,
      opacity: isHighlighter ? 0.45 : 1,
      points: [coords],
    };

    currentStrokeRef.current = newStroke;
    setStrokes((prev) => [...prev, newStroke]);
    setUndoneStrokes([]);
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (activeTool === 'read') return;

    const coords = getCanvasCoords(clientX, clientY);

    if (activeTool === 'eraser' && currentStrokeRef.current) {
      eraseStrokeAt(coords.x, coords.y);
      return;
    }

    if (currentStrokeRef.current) {
      currentStrokeRef.current.points.push(coords);
      setStrokes((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          ...currentStrokeRef.current!,
          points: [...currentStrokeRef.current!.points],
        };
        return next;
      });
    }
  };

  const handlePointerUp = () => {
    currentStrokeRef.current = null;
  };

  const eraseStrokeAt = (x: number, y: number) => {
    const threshold = 18;
    setStrokes((prev) =>
      prev.filter((stroke) => {
        const hit = stroke.points.some((p) => {
          const dx = p.x - x;
          const dy = p.y - y;
          return Math.sqrt(dx * dx + dy * dy) <= threshold;
        });
        return !hit;
      })
    );
  };

  // Undo / Redo
  const handleUndo = () => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    setStrokes((prev) => prev.slice(0, prev.length - 1));
    setUndoneStrokes((prev) => [...prev, last]);
  };

  const handleRedo = () => {
    if (undoneStrokes.length === 0) return;
    const last = undoneStrokes[undoneStrokes.length - 1];
    setUndoneStrokes((prev) => prev.slice(0, prev.length - 1));
    setStrokes((prev) => [...prev, last]);
  };

  const handleClearAll = () => {
    if (strokes.length === 0 && notes.length === 0) return;
    if (window.confirm('Clear all drawings and sticky notes on this lab sheet?')) {
      setStrokes([]);
      setUndoneStrokes([]);
      setNotes([]);
    }
  };

  // Export to Word (.docx)
  const handleExportDocx = async () => {
    setIsExportingDocx(true);
    try {
      let canvasImageBase64: string | null = null;
      if (canvasRef.current && strokes.length > 0) {
        canvasImageBase64 = canvasRef.current.toDataURL('image/png');
      }

      const blob = await generateLabsheetDocx({
        manifest,
        studentName,
        studentId,
        canvasImageBase64,
        notes,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanLabNum = String(manifest.labNumber).padStart(2, '0');
      a.download = `MAI5124_Lab${cleanLabNum}_Labsheet_Annotated.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Export as PDF via system print
  const handlePrintPdf = () => {
    window.print();
  };

  // Copy code snippet
  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIdx(idx);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  // Parse markdown into sections
  const markdownBlocks = manifest.instructionsMarkdown.split('\n\n');

  return (
    <div
      ref={containerRef}
      data-labsheet-print-root
      className="relative flex-1 bg-[#FAFAFA] overflow-y-auto text-slate-900 font-sans selection:bg-amber-100 selection:text-amber-900"
    >
      {/* 1. TOP READING PROGRESS BAR (MEDIUM STYLE) */}
      <div data-labsheet-no-print className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-200">
        <div
          className="h-full bg-blue-900 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* 2. STICKY FLOATING ANNOTATION TOOLBAR */}
      <aside data-labsheet-no-print aria-label="Annotation tools" className="sticky top-4 z-40 max-w-3xl mx-auto px-4 pointer-events-none mb-6">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl p-2 px-3 flex items-center justify-between pointer-events-auto gap-2">
          {/* Main Annotation Tools */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTool('read')}
              title="Reading & Select Mode (Pan & text selection)"
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTool === 'read'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MousePointer className="w-4 h-4" />
              <span className="hidden sm:inline">Read</span>
            </button>

            <button
              onClick={() => setActiveTool('pen')}
              title="Pen Tool (Draw, circle, underline)"
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTool === 'pen'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <PenTool className="w-4 h-4" />
              <span className="hidden sm:inline">Pen</span>
            </button>

            <button
              onClick={() => setActiveTool('highlighter')}
              title="Highlighter Tool (Translucent marker)"
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTool === 'highlighter'
                  ? 'bg-amber-400 text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Highlighter className="w-4 h-4" />
              <span className="hidden sm:inline">Highlight</span>
            </button>

            <button
              onClick={() => setActiveTool('eraser')}
              title="Eraser Tool (Click or drag over strokes)"
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTool === 'eraser'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Eraser className="w-4 h-4" />
              <span className="hidden sm:inline">Eraser</span>
            </button>

            <button
              onClick={() => setActiveTool('note')}
              title="Add Sticky Note (Click on sheet to drop a note)"
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTool === 'note'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span className="hidden sm:inline">Note</span>
              {notes.length > 0 && (
                <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {notes.length}
                </span>
              )}
            </button>
          </div>

          {/* Color Palettes when Pen or Highlighter is Active */}
          {activeTool === 'pen' && (
            <div className="flex items-center space-x-1 border-l border-slate-200 pl-2">
              {[
                { color: '#2563eb', label: 'Blue' },
                { color: '#dc2626', label: 'Red' },
                { color: '#059669', label: 'Green' },
                { color: '#18181b', label: 'Black' },
              ].map((c) => (
                <button
                  key={c.color}
                  onClick={() => setPenColor(c.color)}
                  aria-label={`Select ${c.label} pen color`}
                  className={`w-5 h-5 rounded-full border cursor-pointer transition-transform ${
                    penColor === c.color ? 'scale-125 ring-2 ring-blue-400 border-white' : 'border-slate-300'
                  }`}
                  style={{ backgroundColor: c.color }}
                />
              ))}
              <div className="flex items-center space-x-1 ml-1.5 pl-1.5 border-l border-slate-200">
                {[2, 4, 6].map((w) => (
                  <button
                    key={w}
                    onClick={() => setPenWidth(w)}
                    aria-label={`Set pen stroke width to ${w} pixels`}
                    className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold cursor-pointer ${
                      penWidth === w ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {w === 2 ? 'S' : w === 4 ? 'M' : 'L'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTool === 'highlighter' && (
            <div className="flex items-center space-x-1.5 border-l border-slate-200 pl-2">
              {[
                { color: 'rgba(250, 204, 21, 0.45)', bg: '#fde047', label: 'Yellow' },
                { color: 'rgba(74, 222, 128, 0.45)', bg: '#86efac', label: 'Green' },
                { color: 'rgba(244, 114, 182, 0.45)', bg: '#f472b6', label: 'Pink' },
              ].map((c) => (
                <button
                  key={c.color}
                  onClick={() => setHighlighterColor(c.color)}
                  aria-label={`Select ${c.label} highlighter`}
                  className={`w-5 h-5 rounded-full border cursor-pointer transition-transform ${
                    highlighterColor === c.color ? 'scale-125 ring-2 ring-amber-400 border-white' : 'border-slate-300'
                  }`}
                  style={{ backgroundColor: c.bg }}
                />
              ))}
            </div>
          )}

          {/* Action Tools: Undo, Redo, Clear, Exports & Begin Lab */}
          <div className="flex items-center space-x-1 border-l border-slate-200 pl-2">
            <button
              onClick={handleUndo}
              disabled={strokes.length === 0}
              title="Undo stroke"
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-30 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={undoneStrokes.length === 0}
              title="Redo stroke"
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-30 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleClearAll}
              disabled={strokes.length === 0 && notes.length === 0}
              title="Clear all annotations"
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg disabled:opacity-30 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Export Word (.docx) */}
            <button
              onClick={handleExportDocx}
              disabled={isExportingDocx}
              title="Export complete labsheet with drawings & notes as Word document"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl text-xs font-semibold cursor-pointer border border-blue-200 transition-all ml-1"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {isExportingDocx ? 'Exporting...' : 'Export Word'}
              </span>
            </button>

            {/* Export PDF */}
            <button
              onClick={handlePrintPdf}
              title="Export or print as PDF"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold cursor-pointer border border-slate-300 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden md:inline">PDF</span>
            </button>

          </div>
        </div>
      </aside>

      {/* 3. MAIN MEDIUM BLOG STYLE ARTICLE CONTAINER */}
      <article
        ref={articleRef}
        className="relative max-w-3xl mx-auto px-6 pt-6 pb-28 min-h-[90vh]"
      >
        {/* INTERACTIVE CANVAS OVERLAY (Pen & Highlighter Drawings) */}
        <canvas
          ref={canvasRef}
          className={`absolute top-0 left-0 w-full h-full z-20 ${
            activeTool === 'read'
              ? 'pointer-events-none'
              : activeTool === 'pen'
              ? 'cursor-crosshair pointer-events-auto'
              : activeTool === 'highlighter'
              ? 'cursor-cell pointer-events-auto'
              : activeTool === 'eraser'
              ? 'cursor-grab pointer-events-auto'
              : 'cursor-pointer pointer-events-auto'
          }`}
          onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
          onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
          onMouseUp={handlePointerUp}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            if (touch) handlePointerDown(touch.clientX, touch.clientY);
          }}
          onTouchMove={(e) => {
            const touch = e.touches[0];
            if (touch) handlePointerMove(touch.clientX, touch.clientY);
          }}
          onTouchEnd={handlePointerUp}
        />

        {/* STICKY NOTES PINNED OVERLAY */}
        {notes.map((note, idx) => (
          <div
            key={note.id}
            style={{ left: `${note.x}px`, top: `${note.y}px` }}
            className="absolute z-30 transform -translate-x-1/2 -translate-y-2 max-w-xs w-64 bg-amber-50/95 border border-amber-300 rounded-xl p-3 shadow-lg backdrop-blur-xs transition-all"
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 pb-1.5 mb-1.5 border-b border-amber-200">
              <span className="flex items-center gap-1">
                <span>📌 Note #{idx + 1}</span>
                <span className="text-[10px] text-amber-700 font-normal">({note.timestamp})</span>
              </span>
              <button
                onClick={() => setNotes((prev) => prev.filter((n) => n.id !== note.id))}
                className="text-amber-700 hover:text-rose-600 cursor-pointer"
                title="Delete note"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <textarea
              autoFocus={editingNoteId === note.id}
              value={note.text}
              onChange={(e) => {
                const val = e.target.value;
                setNotes((prev) =>
                  prev.map((n) => (n.id === note.id ? { ...n, text: val } : n))
                );
              }}
              onFocus={() => setEditingNoteId(note.id)}
              onBlur={() => setEditingNoteId(null)}
              placeholder="Type your notes, question for TA, or hypotheses here..."
              className="w-full text-xs text-amber-950 bg-transparent resize-y outline-none leading-relaxed min-h-[55px]"
            />
          </div>
        ))}

        {/* 4. EDITORIAL ARTICLE HEADER */}
        <header className="mb-10 pb-8 border-b border-slate-200/80">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wider uppercase text-blue-900 mb-3">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200">
              MAI5124 Laboratory Module
            </span>
            <span>•</span>
            <span className="text-slate-500 font-mono">Lab {String(manifest.labNumber).padStart(2, '0')}</span>
            <span>•</span>
            <span className="text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{manifest.estimatedDuration || '45 min read & practical'}</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-4">
            {manifest.title}
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed mb-6 font-serif">
            {manifest.shortDescription}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 pt-4 border-t border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center text-xs">
                SU
              </div>
              <div>
                <p className="font-semibold text-slate-900">Sunway University Computing</p>
                <p className="text-[11px] text-slate-500">
                  Artificial Intelligence in Software Engineering
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportDocx}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5 text-blue-900" />
                <span>Export Word (.docx)</span>
              </button>
              <button
                onClick={handlePrintPdf}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / PDF</span>
              </button>
            </div>
          </div>
        </header>

        {/* 5. TARGET COMPETENCIES & LEARNING OUTCOMES CARD */}
        {manifest.learningOutcomes && manifest.learningOutcomes.length > 0 && (
          <div className="my-8 p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-900 uppercase tracking-wider mb-3">
              <BookOpen className="w-4 h-4 text-blue-800" />
              <span>Target Engineering Competencies</span>
            </div>
            <ul className="space-y-2.5">
              {manifest.learningOutcomes.map((outcome, idx) => (
                <li key={idx} className="flex items-start space-x-3 text-sm text-slate-700 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 6. RICH ARTICLE BODY (EDITORIAL MEDIUM STYLE) */}
        <div className="space-y-6 text-[18px] text-slate-800 leading-[1.8] font-serif">
          {markdownBlocks.map((block, idx) => {
            const trimmed = block.trim();
            if (!trimmed) return null;

            // Horizontal separator between theory and practical sheet
            if (trimmed === '---') {
              return <hr key={idx} className="my-12 border-0 border-t border-slate-300" />;
            }

            // Heading 1
            if (trimmed.startsWith('# ')) {
              return (
                <h2
                  key={idx}
                  className="font-sans text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-10 mb-4 pt-4 border-t border-slate-200/60"
                >
                  {trimmed.replace(/^# /, '')}
                </h2>
              );
            }

            // Heading 2 or 3
            if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
              return (
                <h3
                  key={idx}
                  className="font-sans text-lg sm:text-xl font-bold text-blue-950 uppercase tracking-wider mt-8 mb-3"
                >
                  {trimmed.replace(/^###? /, '')}
                </h3>
              );
            }

            // Code block
            if (trimmed.startsWith('```')) {
              const codeLines = trimmed.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '');
              return (
                <div key={idx} className="my-6 rounded-2xl overflow-hidden border border-slate-800/80 shadow-md font-sans">
                  <div className="bg-slate-900 px-4 py-2 flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 font-mono">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>Python Reference Specification</span>
                    </span>
                    <button
                      onClick={() => handleCopyCode(codeLines, idx)}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white cursor-pointer px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-all"
                    >
                      {copiedCodeIdx === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy code</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-950 text-slate-100 font-mono text-xs sm:text-[13px] overflow-x-auto leading-relaxed">
                    <code>{codeLines}</code>
                  </pre>
                </div>
              );
            }

            // Bullet list
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
              const items = trimmed.split('\n');
              return (
                <ul key={idx} className="my-4 space-y-2 list-none pl-2">
                  {items.map((item, itemIdx) => {
                    const clean = item.replace(/^[-*]\s+/, '').trim();
                    if (!clean) return null;
                    return (
                      <li key={itemIdx} className="flex items-start space-x-3 text-slate-700">
                        <span className="text-blue-600 font-bold text-lg leading-none mt-1">•</span>
                        <span>{renderInlineMarkdown(clean)}</span>
                      </li>
                    );
                  })}
                </ul>
              );
            }

            // Numbered list
            if (/^\d+\.\s/.test(trimmed)) {
              const items = trimmed.split('\n');
              return (
                <ol key={idx} className="my-4 space-y-2.5 pl-2">
                  {items.map((item, itemIdx) => {
                    const numMatch = item.match(/^(\d+)\.\s+(.*)$/);
                    if (!numMatch) return null;
                    return (
                      <li key={itemIdx} className="flex items-start space-x-3 text-slate-700">
                        <span className="font-sans font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 mt-0.5">
                          {numMatch[1]}
                        </span>
                        <span>{renderInlineMarkdown(numMatch[2])}</span>
                      </li>
                    );
                  })}
                </ol>
              );
            }

            // Blockquote
            if (trimmed.startsWith('>')) {
              const quoteContent = trimmed.replace(/^>\s*/, '');
              return (
                <blockquote
                  key={idx}
                  className="my-6 pl-5 border-l-4 border-blue-900 italic text-slate-700 font-serif text-[19px] leading-relaxed bg-blue-50/30 py-2 rounded-r-lg"
                >
                  {renderInlineMarkdown(quoteContent)}
                </blockquote>
              );
            }

            // Standard narrative paragraph
            return (
              <p key={idx} className="leading-[1.85] text-slate-800">
                {renderInlineMarkdown(trimmed)}
              </p>
            );
          })}
        </div>

        {/* 7. STARTER FILES & SPECIFICATIONS OVERVIEW */}
        {manifest.starterFiles && manifest.starterFiles.length > 0 && (
          <div className="my-10 p-6 bg-white rounded-2xl border border-slate-200 shadow-xs font-sans">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              <Layers className="w-4 h-4 text-blue-900" />
              <span>Workspace Starter Modules</span>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              When you begin the lab, the following files will be automatically loaded into your interactive coding environment:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {manifest.starterFiles.map((file, fIdx) => (
                <div
                  key={fIdx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between"
                >
                  <div className="flex items-center space-x-2 font-mono text-xs font-semibold text-slate-800">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>{file.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase mt-2 font-mono">
                    {file.language} file
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. BEGIN LAB: intentionally placed only after the reading/lab sheet */}
        <section data-labsheet-no-print className="mt-14 pt-8 border-t border-slate-200 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-900">
                Theory and lab sheet complete
              </p>
              <h3 className="mt-1 text-xl font-semibold text-slate-950">
                Continue to the practical workspace
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 max-w-xl">
                Implement the required b-threads, run the program, verify the public tests,
                complete the visual design, and add evidence to your report.
              </p>
            </div>
            <button
              type="button"
              onClick={onBeginLab}
              className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-md text-sm font-semibold transition-colors cursor-pointer"
            >
              Begin Lab
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </article>
    </div>
  );
};
