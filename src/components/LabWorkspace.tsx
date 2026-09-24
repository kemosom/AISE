import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Play,
  RotateCcw,
  CheckSquare,
  Bookmark,
  FileText,
  Send,
  Code,
  Layout,
  BookOpen,
  Eye,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import type { AuthUserPublic } from '../../lib/auth/types';
import type { LabManifest } from '../../labs/types';
import { apiClient } from '../lib/api-client';
import { LabGuidePanel } from './LabGuidePanel';
import { VisualDesignPanel } from './VisualDesignPanel';
import { MonacoEditorPanel, type EditorFile } from './MonacoEditorPanel';
import { OutputConsolePanel } from './OutputConsolePanel';
import { TestRunnerPanel } from './TestRunnerPanel';
import { ReportWorkspace, type ReportState } from './ReportWorkspace';
import { SubmitLabModal } from './SubmitLabModal';
import { LabTheoryArticle } from './LabTheoryArticle';
import { defaultCodeRunner } from '../../lib/runners/pyodide-runner';
import type { ExecutionResult } from '../../lib/runners/types';

interface LabWorkspaceProps {
  labId: string;
  user: AuthUserPublic;
  onBack: () => void;
  isInstructorPreview?: boolean;
}

export const LabWorkspace: React.FC<LabWorkspaceProps> = ({
  labId,
  user,
  onBack,
  isInstructorPreview,
}) => {
  const [manifest, setManifest] = useState<LabManifest | null>(null);
  const [labMeta, setLabMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Main View: 'theory' (Medium style article) vs 'ide' vs 'report'
  const [viewMode, setViewMode] = useState<'theory' | 'ide' | 'report'>('theory');

  // IDE Panel Layout Selection for responsive/focused workflows
  // 'quad': All 4 columns, 'split': 2 columns, 'editor-output': focused code & run
  const [panelFocus, setPanelFocus] = useState<'all' | 'guide' | 'design' | 'code' | 'output'>('all');

  // Code files
  const [files, setFiles] = useState<EditorFile[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [codeSaveStatus, setCodeSaveStatus] = useState<'Saved' | 'Saving...' | 'Save failed'>('Saved');

  // Visual Graph
  const [visualGraph, setVisualGraph] = useState<any>({ nodes: [], edges: [] });

  // Execution Output
  const [execResult, setExecResult] = useState<ExecutionResult | null>(null);
  const [isRunningCode, setIsRunningCode] = useState(false);

  // Automated Tests Modal / Drawer
  const [isTestHarnessOpen, setIsTestHarnessOpen] = useState(false);
  const [testStats, setTestStats] = useState<{ passed: number; total: number } | null>(null);

  // Report State
  const [reportState, setReportState] = useState<ReportState>({ title: '', sections: [] });
  const [reportSaveStatus, setReportSaveStatus] = useState<string>('All changes saved');
  const [checkpoints, setCheckpoints] = useState<any[]>([]);

  // Submission State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submissionCompleted, setSubmissionCompleted] = useState(false);

  // Debounced auto-save timers
  const saveTimeoutRef = useRef<any>(null);
  const reportSaveTimeoutRef = useRef<any>(null);

  // Open-access students share no server identity. Persist their personal
  // workspace in this browser so one learner can never overwrite another
  // learner's code/report through the synthetic "open-student" account.
  const useLocalPersistence = user.id === 'open-student' && !isInstructorPreview;
  const localKey = (kind: string) => `aise:${labId}:${kind}`;

  const readLocal = <T,>(kind: string): T | null => {
    if (!useLocalPersistence) return null;
    try {
      const raw = window.localStorage.getItem(localKey(kind));
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  };

  const writeLocal = (kind: string, value: unknown) => {
    if (!useLocalPersistence) return;
    try {
      window.localStorage.setItem(localKey(kind), JSON.stringify(value));
    } catch (err) {
      console.warn(`Unable to save local ${kind}`, err);
    }
  };

  const createInitialReport = (labManifest: LabManifest): ReportState => ({
    title: labManifest.reportTemplate.title,
    studentName: '',
    studentId: '',
    sections: labManifest.reportTemplate.sections.map((section) => ({
      id: section.id,
      title: section.title,
      content: '',
    })),
  });

  useEffect(() => {
    loadLabWorkspace();
  }, [labId]);

  const loadLabWorkspace = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.get(
        `/api/labs/${labId}?preview=${isInstructorPreview ? 'true' : 'false'}`
      );

      const loadedManifest = data.manifest as LabManifest;
      setManifest(loadedManifest);
      setLabMeta(data.lab);

      if (useLocalPersistence) {
        const savedFiles = readLocal<EditorFile[]>('files');
        const savedDesign = readLocal<any>('visual-design');
        const savedReport = readLocal<ReportState>('report');
        const savedCheckpoints = readLocal<any[]>('checkpoints');
        const savedSubmission = readLocal<any>('submission');
        const savedTestStats = readLocal<{ passed: number; total: number }>('test-stats');

        setFiles(
          savedFiles && savedFiles.length > 0
            ? savedFiles
            : loadedManifest.starterFiles
        );
        setVisualGraph(
          savedDesign || loadedManifest.visualDesign || { nodes: [], edges: [] }
        );
        setReportState(savedReport || createInitialReport(loadedManifest));
        setCheckpoints(savedCheckpoints || []);
        setSubmissionCompleted(Boolean(savedSubmission));
        setTestStats(savedTestStats);
        return;
      }

      // Authenticated/instructor mode can continue using the server data layer.
      try {
        const wsData = await apiClient.get(`/api/workspaces/${labId}`);
        setFiles(wsData.files || loadedManifest.starterFiles);
      } catch {
        setFiles(loadedManifest.starterFiles);
      }

      try {
        const vdData = await apiClient.get(`/api/visual-designs/${labId}`);
        setVisualGraph(
          vdData.state || loadedManifest.visualDesign || { nodes: [], edges: [] }
        );
      } catch {
        setVisualGraph(loadedManifest.visualDesign || { nodes: [], edges: [] });
      }

      try {
        const repData = await apiClient.get(`/api/reports/${labId}`);
        setReportState(
          repData.report?.contentJson || createInitialReport(loadedManifest)
        );
      } catch {
        setReportState(createInitialReport(loadedManifest));
      }

      try {
        const subData = await apiClient.get(`/api/submissions/${labId}`);
        setSubmissionCompleted(Boolean(subData.submission));
      } catch {
        setSubmissionCompleted(false);
      }

      try {
        const cpData = await apiClient.get(`/api/checkpoints/${labId}`);
        setCheckpoints(cpData.checkpoints || []);
      } catch {
        setCheckpoints([]);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading lab');
    } finally {
      setLoading(false);
    }
  };

  // Debounced Save Workspace Code
  const handleContentChange = (newContent: string) => {
    const updated = [...files];
    updated[activeFileIndex] = { ...updated[activeFileIndex], content: newContent };
    setFiles(updated);
    setCodeSaveStatus('Saving...');

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      if (useLocalPersistence) {
        writeLocal('files', updated);
        setCodeSaveStatus('Saved');
        return;
      }

      try {
        await apiClient.post(`/api/workspaces/${labId}`, { files: updated });
        setCodeSaveStatus('Saved');
      } catch {
        setCodeSaveStatus('Save failed');
      }
    }, 700);
  };

  const handleAddFile = (fileName: string) => {
    const newFile: EditorFile = {
      name: fileName,
      language: fileName.endsWith('.py') ? 'python' : fileName.endsWith('.md') ? 'markdown' : 'json',
      content: `# ${fileName}\n`,
    };
    const updated = [...files, newFile];
    setFiles(updated);
    setActiveFileIndex(updated.length - 1);
    writeLocal('files', updated);
  };

  const handleDeleteFile = (idx: number) => {
    if (files.length <= 1) return;
    const updated = files.filter((_, i) => i !== idx);
    setFiles(updated);
    setActiveFileIndex(0);
    writeLocal('files', updated);
  };

  // Save Visual Graph
  const handleUpdateVisualGraph = async (newGraph: any) => {
    setVisualGraph(newGraph);

    if (useLocalPersistence) {
      writeLocal('visual-design', newGraph);
      return;
    }

    try {
      await apiClient.post(`/api/visual-designs/${labId}`, {
        designType: 'react-flow',
        state: newGraph,
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Run Code via Pyodide
  const handleRunCode = async () => {
    setIsRunningCode(true);
    try {
      const activeFile = files[activeFileIndex] || files[0];
      // Ensure all current workspace files are passed to Pyodide virtual filesystem
      const allFiles = files.map((f, i) =>
        i === activeFileIndex ? { ...f, content: activeFile.content } : f
      );

      const result = await defaultCodeRunner.run(activeFile.content, allFiles);
      setExecResult(result);
    } catch (err: any) {
      setExecResult({
        stdout: '',
        stderr: err.message || String(err),
        error: err.message || String(err),
        exitCode: 1,
        executionTimeMs: 0,
        plots: [],
      });
    } finally {
      setIsRunningCode(false);
    }
  };

  // Debounced Save Report
  const handleUpdateReportState = (newReport: ReportState) => {
    setReportState(newReport);
    setReportSaveStatus('Saving...');

    if (reportSaveTimeoutRef.current) clearTimeout(reportSaveTimeoutRef.current);
    reportSaveTimeoutRef.current = setTimeout(async () => {
      if (useLocalPersistence) {
        writeLocal('report', newReport);
        setReportSaveStatus('Saved in this browser');
        return;
      }

      try {
        await apiClient.post(`/api/reports/${labId}`, {
          title: newReport.title,
          contentJson: newReport,
        });
        setReportSaveStatus('Saved just now');
      } catch {
        setReportSaveStatus('Save failed');
      }
    }, 700);
  };

  // Checkpoints
  const handleCreateCheckpoint = async (label: string, snapshot: any) => {
    if (useLocalPersistence) {
      const checkpoint = {
        id: `local-${Date.now()}`,
        label,
        snapshot,
        createdAt: new Date().toISOString(),
      };
      const updated = [checkpoint, ...checkpoints];
      setCheckpoints(updated);
      writeLocal('checkpoints', updated);
      return;
    }

    try {
      const res = await apiClient.post(`/api/checkpoints/${labId}`, {
        label,
        snapshot,
      });
      if (res.checkpoint) {
        setCheckpoints((prev) => [res.checkpoint, ...prev]);
      }
    } catch (err) {
      console.error('Failed to create checkpoint', err);
    }
  };

  // Evidence Insertion Handlers
  const handleAddCodeSnapshotToReport = (snapshot: { title: string; code: string }) => {
    const targetSection = reportState.sections.find((s) => s.id === 'implementation') || reportState.sections[0];
    if (!targetSection) return;

    const curSnaps = targetSection.codeSnapshots || [];
    const updatedSnaps = [...curSnaps, { title: snapshot.title, code: snapshot.code }];

    const updatedSections = reportState.sections.map((s) =>
      s.id === targetSection.id ? { ...s, codeSnapshots: updatedSnaps } : s
    );

    handleUpdateReportState({ ...reportState, sections: updatedSections });
  };

  const handleAddOutputToReport = (output: string) => {
    const targetSection = reportState.sections.find((s) => s.id === 'results') || reportState.sections[0];
    if (!targetSection) return;

    const currentContent = targetSection.content ? `${targetSection.content}\n\n` : '';
    const newContent = `${currentContent}[Captured Execution Output]\n${output}`;

    const updatedSections = reportState.sections.map((s) =>
      s.id === targetSection.id ? { ...s, content: newContent } : s
    );

    handleUpdateReportState({ ...reportState, sections: updatedSections });
  };

  const handleAddPlotToReport = (plotBase64: string, caption?: string) => {
    const targetSection = reportState.sections.find((s) => s.id === 'results') || reportState.sections[0];
    if (!targetSection) return;

    const curImages = targetSection.images || [];
    const updatedImages = [...curImages, { base64Data: plotBase64, caption: caption || 'Execution Figure' }];

    const updatedSections = reportState.sections.map((s) =>
      s.id === targetSection.id ? { ...s, images: updatedImages } : s
    );

    handleUpdateReportState({ ...reportState, sections: updatedSections });
  };

  const handleAddDesignToReport = (summary: string) => {
    const targetSection = reportState.sections.find((s) => s.id === 'methodology') || reportState.sections[0];
    if (!targetSection) return;

    const currentContent = targetSection.content ? `${targetSection.content}\n\n` : '';
    const newContent = `${currentContent}[Visual Pipeline Design]\n${summary}`;

    const updatedSections = reportState.sections.map((s) =>
      s.id === targetSection.id ? { ...s, content: newContent } : s
    );

    handleUpdateReportState({ ...reportState, sections: updatedSections });
  };

  const handleAddTestResultsToReport = (testSummary: string) => {
    const targetSection = reportState.sections.find((s) => s.id === 'results') || reportState.sections[0];
    if (!targetSection) return;

    const currentContent = targetSection.content ? `${targetSection.content}\n\n` : '';
    const newContent = `${currentContent}[Automated Verification Results]\n${testSummary}`;

    const updatedSections = reportState.sections.map((s) =>
      s.id === targetSection.id ? { ...s, content: newContent } : s
    );

    handleUpdateReportState({ ...reportState, sections: updatedSections });
  };

  const handleInsertCodeIntoActiveEditor = (codeSnippet: string) => {
    const curContent = files[activeFileIndex]?.content || '';
    const newContent = `${curContent}\n\n# --- Inserted Component ---\n${codeSnippet}`;
    handleContentChange(newContent);
  };

  // Submit Lab. In open-access mode the submission snapshot is private
  // to this browser; authenticated deployments can persist it server-side.
  const handleConfirmSubmit = async () => {
    const snapshot = {
      reportSnapshot: reportState,
      codeSnapshot: files,
      visualDesignSnapshot: visualGraph,
      testResultsSnapshot: {
        total: testStats?.total ?? manifest?.tests.length ?? 0,
        passed: testStats?.passed ?? 0,
      },
      submittedAt: new Date().toISOString(),
    };

    if (useLocalPersistence) {
      writeLocal('submission', snapshot);
      setSubmissionCompleted(true);
      setIsSubmitModalOpen(false);
      return;
    }

    await apiClient.post(`/api/submissions/${labId}`, snapshot);
    setSubmissionCompleted(true);
    setIsSubmitModalOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-slate-50 text-xs text-slate-500 font-mono">
        Initializing AISE Laboratory Workspace & Pyodide Environment...
      </div>
    );
  }

  if (error || !manifest) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-xs mb-4">
          {error || 'Module could not be loaded'}
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const filledSectionsCount = reportState.sections.filter(
    (s) => s.content && s.content.trim().length > 0
  ).length;

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-slate-100 overflow-hidden">
      {/* Top Workspace Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 h-12 flex items-center justify-between shadow-2xs z-20">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              Lab {String(manifest.labNumber).padStart(2, '0')}
            </span>
            <h1 className="text-xs font-bold text-slate-900 truncate max-w-sm sm:max-w-md">
              {manifest.title}
            </h1>
          </div>

          <div className="hidden lg:flex items-center space-x-2 border-l border-slate-200 pl-3">
            <span className="text-[11px] font-mono text-slate-400">Code: {codeSaveStatus}</span>
          </div>
        </div>

        {/* Center Mode Switcher: Theory vs IDE vs Report */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setViewMode('theory')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center space-x-1.5 ${
              viewMode === 'theory'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-900" />
            <span>Theory & Labsheet</span>
          </button>
          <button
            onClick={() => setViewMode('ide')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center space-x-1.5 ${
              viewMode === 'ide'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-blue-900" />
            <span>IDE Workspace</span>
          </button>
          <button
            onClick={() => setViewMode('report')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center space-x-1.5 ${
              viewMode === 'report'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-900" />
            <span>Lab Report ({filledSectionsCount}/{reportState.sections.length})</span>
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center space-x-2">
          {viewMode === 'ide' && (
            <>
              {/* Panel Focus Switcher on smaller laptops */}
              <div className="hidden md:flex items-center space-x-1 bg-slate-100 p-0.5 rounded border border-slate-200 text-[11px]">
                <button
                  onClick={() => setPanelFocus('all')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    panelFocus === 'all' ? 'bg-white text-slate-900 font-semibold' : 'text-slate-600'
                  }`}
                  title="Show all 4 panels"
                >
                  All Panels
                </button>
                <button
                  onClick={() => setPanelFocus('code')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    panelFocus === 'code' ? 'bg-white text-slate-900 font-semibold' : 'text-slate-600'
                  }`}
                  title="Focus Code Editor"
                >
                  Code Focus
                </button>
              </div>

              <button
                onClick={() => setIsTestHarnessOpen(!isTestHarnessOpen)}
                className={`inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded border cursor-pointer transition-colors ${
                  isTestHarnessOpen
                    ? 'bg-blue-50 text-blue-900 border-blue-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5 text-blue-900" />
                <span>
                  {testStats === null
                    ? 'Tests (Not Run)'
                    : `Tests (${testStats.passed}/${testStats.total})`}
                </span>
              </button>

              <button
                onClick={handleRunCode}
                disabled={isRunningCode}
                className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isRunningCode ? 'Running...' : 'Run Python'}</span>
              </button>
            </>
          )}

          {submissionCompleted ? (
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Submitted</span>
            </div>
          ) : (
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="inline-flex items-center space-x-1 px-3.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Lab</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-hidden relative">
        {/* VIEW 0: THEORY & LABSHEET ARTICLE (MEDIUM STYLE WITH ANNOTATIONS) */}
        {viewMode === 'theory' && (
          <div className="h-full flex overflow-hidden">
            <LabTheoryArticle
              manifest={manifest}
              studentName={reportState.studentName || user.name}
              studentId={reportState.studentId || user.studentId}
              onBeginLab={() => setViewMode('ide')}
              onSwitchToReport={() => setViewMode('report')}
            />
          </div>
        )}

        {/* VIEW 1: IDE WORKSPACE */}
        {viewMode === 'ide' && (
          <div className="h-full flex overflow-hidden">
            {/* Panel 1: Lab Guide (Markdown instructions) */}
            {(panelFocus === 'all' || panelFocus === 'guide') && (
              <div className="w-72 lg:w-80 shrink-0 h-full hidden md:block">
                <LabGuidePanel
                  instructionsMarkdown={manifest.instructionsMarkdown}
                  learningOutcomes={manifest.learningOutcomes}
                />
              </div>
            )}

            {/* Panel 2: Visual Design (React Flow / Blockly / Palette) */}
            {(panelFocus === 'all' || panelFocus === 'design') && (
              <div className="w-72 lg:w-80 shrink-0 h-full hidden xl:block">
                <VisualDesignPanel
                  snippets={manifest.snippets}
                  blocks={manifest.blocks}
                  visualGraph={visualGraph}
                  onUpdateVisualGraph={handleUpdateVisualGraph}
                  onInsertCodeToEditor={handleInsertCodeIntoActiveEditor}
                  onAddDesignToReport={handleAddDesignToReport}
                />
              </div>
            )}

            {/* Panel 3: Monaco Code Editor */}
            <div className="flex-1 min-w-[320px] h-full">
              <MonacoEditorPanel
                files={files}
                activeFileIndex={activeFileIndex}
                onSelectFile={setActiveFileIndex}
                onChangeContent={handleContentChange}
                onAddFile={handleAddFile}
                onDeleteFile={handleDeleteFile}
                saveStatus={codeSaveStatus}
                onAddCodeToReport={handleAddCodeSnapshotToReport}
              />
            </div>

            {/* Panel 4: Output Console & Matplotlib Plots */}
            {(panelFocus === 'all' || panelFocus === 'output') && (
              <div className="w-80 lg:w-96 shrink-0 h-full hidden sm:block">
                <OutputConsolePanel
                  result={execResult}
                  isRunning={isRunningCode}
                  onClearConsole={() => setExecResult(null)}
                  onRestartRuntime={() => defaultCodeRunner.reset()}
                  onAddOutputToReport={handleAddOutputToReport}
                  onAddPlotToReport={handleAddPlotToReport}
                />
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: LAB REPORT WORKSPACE */}
        {viewMode === 'report' && (
          <div className="h-full">
            <ReportWorkspace
              labId={labId}
              labNumber={manifest.labNumber}
              labTitle={manifest.title}
              user={user}
              reportState={reportState}
              onUpdateReportState={handleUpdateReportState}
              onSaveReport={async (rep) => handleUpdateReportState(rep)}
              saveStatus={reportSaveStatus}
              checkpoints={checkpoints}
              onCreateCheckpoint={handleCreateCheckpoint}
            />
          </div>
        )}

        {/* Automated Test Harness Floating Drawer */}
        {isTestHarnessOpen && (
          <div className="absolute right-4 top-4 w-96 max-w-[90vw] z-30 shadow-2xl">
            <div className="flex justify-end mb-1">
              <button
                onClick={() => setIsTestHarnessOpen(false)}
                className="text-xs bg-slate-800 text-white px-2 py-0.5 rounded cursor-pointer hover:bg-slate-700"
              >
                ✕ Close Harness
              </button>
            </div>
            <TestRunnerPanel
              tests={manifest.tests}
              runner={defaultCodeRunner}
              userCode={files[activeFileIndex]?.content || files[0]?.content || ''}
              files={files}
              onAddTestResultsToReport={handleAddTestResultsToReport}
              onTestRunComplete={(passed, total) => {
                const stats = { passed, total };
                setTestStats(stats);

                if (useLocalPersistence) {
                  writeLocal('test-stats', stats);
                } else {
                  apiClient
                    .post(`/api/labs/${labId}/test-run`, stats)
                    .catch(() => {});
                }
              }}
            />
          </div>
        )}

        {/* Submit Confirmation Modal */}
        {isSubmitModalOpen && (
          <SubmitLabModal
            labNumber={manifest.labNumber}
            labTitle={manifest.title}
            testPassedCount={testStats ? testStats.passed : 0}
            totalTests={manifest.tests.length}
            reportSectionsFilled={filledSectionsCount}
            totalReportSections={reportState.sections.length}
            onConfirmSubmit={handleConfirmSubmit}
            onClose={() => setIsSubmitModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
};
