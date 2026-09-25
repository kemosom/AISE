import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Play,
  CheckSquare,
  FileText,
  Code,
  ListChecks,
  BookOpen,
} from 'lucide-react';
import type { AuthUserPublic } from '../../lib/auth/types';
import type { LabManifest } from '../../labs/types';
import { apiClient } from '../lib/api-client';
import { MonacoEditorPanel, type EditorFile } from './MonacoEditorPanel';
import { OutputConsolePanel } from './OutputConsolePanel';
import { TestRunnerPanel } from './TestRunnerPanel';
import { ReportWorkspace, type ReportState } from './ReportWorkspace';
import { LabTheoryArticle } from './LabTheoryArticle';
import { LabStepsPanel } from './LabStepsPanel';
import {
  Lab02ProductPreviewPanel,
  type NlpPlaygroundPrediction,
} from './Lab02ProductPreviewPanel';
import { defaultCodeRunner } from '../../lib/runners/pyodide-runner';
import type { ExecutionResult } from '../../lib/runners/types';
import { getBrowserValue, setBrowserValue } from '../lib/browser-persistence';
import { LabRegistry } from '../../labs/registry';

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

  // Keep the student workflow explicit: theory, steps, code, and report.
  const [viewMode, setViewMode] = useState<'theory' | 'steps' | 'code' | 'report'>('theory');

  // Code files
  const [files, setFiles] = useState<EditorFile[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [codeSaveStatus, setCodeSaveStatus] = useState<'Saved' | 'Saving...' | 'Save failed'>('Saved');

  // Execution Output
  const [execResult, setExecResult] = useState<ExecutionResult | null>(null);
  const [isRunningCode, setIsRunningCode] = useState(false);

  // Automated Tests Modal / Drawer
  const [isTestHarnessOpen, setIsTestHarnessOpen] = useState(false);
  const [testStats, setTestStats] = useState<{ passed: number; total: number } | null>(null);

  // Report State
  const [reportState, setReportState] = useState<ReportState>({ title: '', sections: [] });
  const [reportSaveStatus, setReportSaveStatus] = useState<string>('All changes saved');
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);

  // Debounced auto-save timers
  const saveTimeoutRef = useRef<any>(null);
  const reportSaveTimeoutRef = useRef<any>(null);

  // Open-access students share no server identity. Persist their personal
  // workspace in this browser so one learner can never overwrite another
  // learner's code/report through the synthetic "open-student" account.
  const useLocalPersistence = user.id === 'open-student' && !isInstructorPreview;
  const localKey = (kind: string) => `aise:v2:${labId}:${kind}`;

  const readLocal = async <T,>(kind: string): Promise<T | null> => {
    if (!useLocalPersistence) return null;
    try {
      return await getBrowserValue<T>(localKey(kind));
    } catch (err) {
      console.warn(`Unable to read local ${kind}`, err);
      return null;
    }
  };

  const writeLocal = async (kind: string, value: unknown): Promise<void> => {
    if (!useLocalPersistence) return;
    await setBrowserValue(localKey(kind), value);
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

  const mergeReportWithTemplate = (
    saved: ReportState | null,
    labManifest: LabManifest
  ): ReportState => {
    if (!saved) return createInitialReport(labManifest);

    const existingById = new Map(
      (saved.sections || []).map((section) => [section.id, section])
    );

    return {
      title: labManifest.reportTemplate.title,
      studentName: saved.studentName || '',
      studentId: saved.studentId || '',
      sections: labManifest.reportTemplate.sections.map((templateSection) => {
        const existing = existingById.get(templateSection.id);
        return {
          id: templateSection.id,
          title: templateSection.title,
          content: existing?.content || '',
        };
      }),
    };
  };

  useEffect(() => {
    loadLabWorkspace();
  }, [labId]);

  const loadLabWorkspace = async () => {
    setLoading(true);
    setError(null);

    try {
      // Open-access/Vercel mode is intentionally client-side. The complete
      // laboratory manifest is bundled by Vite, so loading a lab must not
      // depend on an Express /api route that does not exist in a static Vercel deployment.
      if (useLocalPersistence) {
        const loadedManifest = LabRegistry.getLab(labId);

        if (!loadedManifest) {
          throw new Error('Laboratory module not found.');
        }

        if (loadedManifest.labNumber > 2) {
          throw new Error('This laboratory is not released yet.');
        }

        setManifest(loadedManifest);
        setLabMeta({
          id: loadedManifest.id,
          labNumber: loadedManifest.labNumber,
          title: loadedManifest.title,
          isUnlocked: true,
          isPublished: true,
        });

        const [
          savedFiles,
          savedReport,
          savedSubmission,
          savedTestStats,
          savedSteps,
        ] = await Promise.all([
          readLocal<EditorFile[]>('files'),
          readLocal<ReportState>('report'),
          readLocal<any>('submission'),
          readLocal<{ passed: number; total: number }>('test-stats'),
          readLocal<string[]>('steps'),
        ]);

        setFiles(
          savedFiles && savedFiles.length > 0
            ? savedFiles
            : loadedManifest.starterFiles
        );
        setReportState(mergeReportWithTemplate(savedReport, loadedManifest));
        setTestStats(savedTestStats);
        setCompletedStepIds(savedSteps || []);
        return;
      }

      // Optional authenticated/instructor deployment path.
      const data = await apiClient.get(
        `/api/labs/${labId}?preview=${isInstructorPreview ? 'true' : 'false'}`
      );

      const loadedManifest = data.manifest as LabManifest;
      setManifest(loadedManifest);
      setLabMeta(data.lab);

      try {
        const wsData = await apiClient.get(`/api/workspaces/${labId}`);
        setFiles(wsData.files || loadedManifest.starterFiles);
      } catch {
        setFiles(loadedManifest.starterFiles);
      }

      try {
        const repData = await apiClient.get(`/api/reports/${labId}`);
        setReportState(
          mergeReportWithTemplate(repData.report?.contentJson || null, loadedManifest)
        );
      } catch {
        setReportState(createInitialReport(loadedManifest));
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
        try {
          await writeLocal('files', updated);
          setCodeSaveStatus('Saved');
        } catch {
          setCodeSaveStatus('Save failed');
        }
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
    void writeLocal('files', updated);
  };

  const handleDeleteFile = (idx: number) => {
    if (files.length <= 1) return;
    const updated = files.filter((_, i) => i !== idx);
    setFiles(updated);
    setActiveFileIndex(0);
    writeLocal('files', updated);
  };

  // Run Code via Pyodide
  const handleRunCode = async () => {
    setIsRunningCode(true);
    try {
      const mainFile = files.find((file) => file.name === 'main.py') || files[0];

      if (!mainFile) {
        throw new Error('main.py is not available in this workspace.');
      }

      // Run the laboratory entry point consistently, regardless of which file
      // the student is currently viewing in Monaco.
      const result = await defaultCodeRunner.run(mainFile.content, files);
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


  const handleAnalyzeLab02Requirement = async (
    text: string
  ): Promise<NlpPlaygroundPrediction> => {
    if (isRunningCode) {
      throw new Error('Wait for the current Python execution to finish.');
    }

    const pythonText = JSON.stringify(text);
    const snippet = [
      'import json',
      'from priority_model import MODEL',
      `text = ${pythonText}`,
      'prediction = MODEL.predict(text)',
      'print("__AISE_NLP__ " + json.dumps(prediction, separators=(",", ":")))',
    ].join('\n');

    const analysisResult = await defaultCodeRunner.run(snippet, files);

    if (analysisResult.exitCode !== 0 || analysisResult.error) {
      throw new Error(
        analysisResult.error ||
          analysisResult.stderr ||
          'The NLP model could not analyse this requirement.'
      );
    }

    const marker = '__AISE_NLP__ ';
    const line = analysisResult.stdout
      .split('\n')
      .find((item) => item.startsWith(marker));

    if (!line) {
      throw new Error('The NLP model did not return a prediction payload.');
    }

    return JSON.parse(line.slice(marker.length)) as NlpPlaygroundPrediction;
  };

  // Debounced Save Report
  const handleUpdateReportState = (newReport: ReportState) => {
    setReportState(newReport);
    setReportSaveStatus('Saving...');

    if (reportSaveTimeoutRef.current) clearTimeout(reportSaveTimeoutRef.current);
    reportSaveTimeoutRef.current = setTimeout(async () => {
      if (useLocalPersistence) {
        try {
          await writeLocal('report', newReport);
          setReportSaveStatus('Saved in this browser');
        } catch {
          setReportSaveStatus('Save failed');
        }
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

  // Evidence Insertion Handlers
  const handleAddCodeSnapshotToReport = (snapshot: { title: string; code: string }) => {
    const targetSection = reportState.sections.find((s) => s.id === 'guardrail') || reportState.sections.find((s) => s.id === 'implementation') || reportState.sections[0];
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

  const handleAddTestResultsToReport = (testSummary: string) => {
    const targetSection = reportState.sections.find((s) => s.id === 'results') || reportState.sections[0];
    if (!targetSection) return;

    const currentContent = targetSection.content ? `${targetSection.content}\n\n` : '';
    const newContent = `${currentContent}[Requirement Verification Results]\n${testSummary}`;

    const updatedSections = reportState.sections.map((s) =>
      s.id === targetSection.id ? { ...s, content: newContent } : s
    );

    handleUpdateReportState({ ...reportState, sections: updatedSections });
  };


  const handleToggleStep = async (stepId: string) => {
    const updated = completedStepIds.includes(stepId)
      ? completedStepIds.filter((id) => id !== stepId)
      : [...completedStepIds, stepId];

    setCompletedStepIds(updated);

    if (useLocalPersistence) {
      try {
        await writeLocal('steps', updated);
      } catch (err) {
        console.warn('Unable to save lab-step progress', err);
      }
    }
  };

  const handleOpenVerification = () => {
    setViewMode('code');
    setIsTestHarnessOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-slate-50 text-xs text-slate-500 font-mono">
        Loading laboratory workspace...
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

        {/* Compact workspace navigation */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 text-xs">
          <button
            onClick={() => setViewMode('theory')}
            className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'theory'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Theory
          </button>
          <button
            onClick={() => setViewMode('steps')}
            className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'steps'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
            Steps
          </button>
          <button
            onClick={() => setViewMode('code')}
            className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'code'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Code
          </button>
          <button
            onClick={() => setViewMode('report')}
            className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'report'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Report
          </button>
        </div>

        {/* Only show execution controls when coding */}
        <div className="flex items-center gap-2">
          {viewMode === 'code' && (
            <>
              <button
                onClick={() => setIsTestHarnessOpen(!isTestHarnessOpen)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border cursor-pointer transition-colors ${
                  isTestHarnessOpen
                    ? 'bg-blue-50 text-blue-900 border-blue-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                {testStats === null
                  ? 'Verify Requirements'
                  : `Verified ${testStats.passed}/${testStats.total}`}
              </button>

              <button
                onClick={handleRunCode}
                disabled={isRunningCode}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {isRunningCode ? 'Running...' : 'Run Python'}
              </button>
            </>
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
              onBeginLab={() => setViewMode('steps')}
            />
          </div>
        )}

        {/* VIEW 1: STEP-BY-STEP WORKFLOW */}
        {viewMode === 'steps' && (
          <LabStepsPanel
            manifest={manifest}
            completedStepIds={completedStepIds}
            onToggleStep={handleToggleStep}
            onOpenCode={() => setViewMode('code')}
            onOpenReport={() => setViewMode('report')}
            onOpenVerification={handleOpenVerification}
          />
        )}

        {/* VIEW 2: CODE WORKSPACE */}
        {viewMode === 'code' && (
          <div className="h-full flex overflow-hidden bg-slate-950">
            <div className="flex-1 min-w-0 h-full">
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
            {labId === 'lab02-requirement-prioritization' ? (
              <div className="w-[52%] min-w-[520px] max-w-[920px] shrink-0 h-full border-l border-slate-800">
                <Lab02ProductPreviewPanel
                  result={execResult}
                  isRunning={isRunningCode}
                  onClearConsole={() => setExecResult(null)}
                  onRestartRuntime={() => defaultCodeRunner.reset()}
                  onAddOutputToReport={handleAddOutputToReport}
                  onAddPlotToReport={handleAddPlotToReport}
                  onAnalyzeRequirement={handleAnalyzeLab02Requirement}
                />
              </div>
            ) : (
              <div className="w-[32%] min-w-[300px] max-w-[430px] shrink-0 h-full border-l border-slate-800">
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

        {/* VIEW 3: LAB REPORT WORKSPACE */}
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
              codeFiles={files}
              testStats={testStats}
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
                  void writeLocal('test-stats', stats);
                } else {
                  apiClient
                    .post(`/api/labs/${labId}/test-run`, stats)
                    .catch(() => {});
                }
              }}
            />
          </div>
        )}

      </div>
    </div>
  );
};
