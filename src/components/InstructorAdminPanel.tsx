import React, { useState } from 'react';
import { LabRegistry } from '../../labs/registry';
import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  Clipboard,
  Code2,
  GraduationCap,
  ShieldCheck,
  Table2,
  Target,
} from 'lucide-react';

interface InstructorAdminPanelProps {
  data: any;
  onExit: () => void;
  onSwitchLab: () => void;
  onPreviewLab: () => void;
}

type AdminTab = 'guide' | 'alignment' | 'solution' | 'results' | 'report' | 'masters';

export const InstructorAdminPanel: React.FC<InstructorAdminPanelProps> = ({
  data,
  onExit,
  onSwitchLab,
  onPreviewLab,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('guide');
  const [copied, setCopied] = useState(false);

  const labLabel = data.labNumber
    ? `Lab ${String(data.labNumber).padStart(2, '0')}`
    : 'Laboratory';

  const copySolution = async () => {
    await navigator.clipboard.writeText(
      [data.solution?.code, data.solution?.setting].filter(Boolean).join('\n\n')
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const tabs: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: 'guide', label: 'Teaching Guide', icon: <BookOpenCheck className="w-4 h-4" /> },
    { id: 'alignment', label: 'CLO/PLO + Decision', icon: <Target className="w-4 h-4" /> },
    { id: 'solution', label: 'Complete Answer', icon: <Code2 className="w-4 h-4" /> },
    { id: 'results', label: 'Expected Results', icon: <Table2 className="w-4 h-4" /> },
    { id: 'report', label: 'Sample Report', icon: <Clipboard className="w-4 h-4" /> },
    { id: 'masters', label: "Master's Level", icon: <GraduationCap className="w-4 h-4" /> },
  ];

  const strategyLabels = data.engineeringDecision?.strategyLabels || {
    strategyA: 'A: Direct AI',
    strategyB: 'B: Policy in model',
    strategyC: 'C: Separated',
  };

  // The earlier encrypted Lab 02 instructor payload belongs to the retired
  // model-training lab. Until it is re-encrypted for the current case study,
  // never display its obsolete answers as if they describe the new lab.
  if (data.labId === 'lab02-requirement-prioritization') {
    const currentLab = LabRegistry.getLab(data.labId);

    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-slate-100">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-7">
          <div className="flex flex-wrap items-center gap-3 mb-7">
            <button type="button" onClick={onExit}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4" /> Exit and lock instructor admin
            </button>
            <button type="button" onClick={onSwitchLab}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-xs font-medium hover:bg-slate-50">
              Switch laboratory
            </button>
          </div>
          <div className="text-xs font-semibold uppercase tracking-widest text-amber-700">
            Instructor only · Lab 02
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            {currentLab?.title || 'Lab 02: Spotify Requirements Prioritization'}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Review the latest two-hour Spotify playlist API case study without
            releasing it to students. The student lab remains locked.
          </p>

          <section className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-semibold text-sm text-amber-950">
              Instructor guide revision pending
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              The previous encrypted Lab 02 complete-answer guide describes
              the retired TF-IDF and model-training exercise. Its old answers
              are hidden here to prevent confusion. The current theory,
              lab sheet, starter code, report template and tests are available
              through the live instructor preview below.
            </p>
          </section>

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={onPreviewLab}
              className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              Open Lab 02 Instructor Preview
            </button>
            <a href="https://developer.spotify.com/documentation/web-api/concepts/playlists"
              target="_blank" rel="noreferrer"
              className="rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Spotify official playlist documentation
            </a>
          </div>

          <section className="mt-7 overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-900">Current Lab 02 teaching sequence</h2>
              <p className="mt-1 text-xs text-slate-500">
                Read from the current course manifest, not from the obsolete answer guide.
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {(currentLab?.tasks || []).map((task, index) => (
                <div key={task.id} className="flex gap-4 p-5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{task.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{task.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-slate-100">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-7">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-6">
          <div>
            <button
              type="button"
              onClick={onExit}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 mb-3"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Exit and lock instructor admin
            </button>
            <button
              type="button"
              onClick={onSwitchLab}
              className="ml-3 inline-flex items-center rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Switch laboratory
            </button>
            <button
              type="button"
              onClick={onPreviewLab}
              className="ml-2 inline-flex items-center rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Preview current lab
            </button>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
              <ShieldCheck className="w-4 h-4" />
              Instructor only · {labLabel}
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-950">
              {data.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {data.overview}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-slate-300 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-slate-950 text-slate-950'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'guide' && (
          <div className="space-y-4">
            {(data.teachingSteps || []).map((item: any) => (
              <section key={item.step} className="bg-white border border-slate-200 rounded-lg p-5">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-slate-950 text-white flex items-center justify-center text-xs font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-950">{item.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
                    <div className="mt-3 rounded-md border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                      <strong>Teaching point:</strong> {item.teachingPoint}
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}

        {activeTab === 'alignment' && data.courseAlignment && data.engineeringDecision && (
          <div className="space-y-5">
            <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200">
                <h2 className="text-sm font-semibold text-slate-950">{labLabel} CLO/PLO contribution</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Instructor-facing alignment and the evidence students should produce.
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {data.courseAlignment.map((item: any) => (
                  <div key={item.clo} className="p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-950">
                        {item.clo} → {item.plo}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                        {item.contribution}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {item.instructorRationale}
                    </p>
                    <div className="mt-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Evidence expected from students
                      </div>
                      <ul className="mt-2 space-y-1.5 text-xs leading-5 text-slate-600">
                        {(item.studentEvidence || []).map((evidence: string) => (
                          <li key={evidence} className="flex gap-2">
                            <span className="text-blue-700">•</span>
                            <span>{evidence}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200">
                <h2 className="text-sm font-semibold text-slate-950">
                  {data.engineeringDecision.title}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Recommended reference approach: {data.engineeringDecision.recommendedStrategy}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="text-left px-4 py-3">Criterion</th>
                      <th className="text-left px-4 py-3">{strategyLabels.strategyA}</th>
                      <th className="text-left px-4 py-3">{strategyLabels.strategyB}</th>
                      <th className="text-left px-4 py-3">{strategyLabels.strategyC}</th>
                      <th className="text-left px-4 py-3">Instructor rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(data.engineeringDecision.comparison || []).map((row: any) => (
                      <tr key={row.criterion} className="align-top">
                        <td className="px-4 py-3 font-semibold text-slate-900">{row.criterion}</td>
                        <td className="px-4 py-3 text-slate-600">{row.strategyA}</td>
                        <td className="px-4 py-3 text-slate-600">{row.strategyB}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{row.strategyC}</td>
                        <td className="px-4 py-3 max-w-md text-slate-600">{row.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-slate-950">Model answer</h2>
              <p className="mt-3 text-sm leading-7 text-slate-700 whitespace-pre-line">
                {data.engineeringDecision.sampleAnswer}
              </p>

              <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Marking indicators
              </h3>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                {(data.engineeringDecision.markingIndicators || []).map((item: string) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {data.courseWideRule && (
              <section className="bg-amber-50 border border-amber-200 rounded-lg p-5">
                <h2 className="text-sm font-semibold text-amber-950">{data.courseWideRule.title}</h2>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-900">
                  {(data.courseWideRule.points || []).map((item: string) => (
                    <li key={item} className="flex gap-2">
                      <span>•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {activeTab === 'solution' && data.solution && (
          <div className="space-y-5">
            <section className="bg-white border border-slate-200 rounded-lg p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-950">Reference implementation</h2>
                  <p className="mt-1 text-xs text-slate-500">{data.solution.instruction}</p>
                </div>
                <button
                  type="button"
                  onClick={copySolution}
                  className="shrink-0 px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium hover:bg-slate-50"
                >
                  {copied ? 'Copied' : 'Copy answer'}
                </button>
              </div>

              <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-950 p-4 text-[12px] leading-6 text-slate-100">
                <code>{data.solution.code}</code>
              </pre>

              {data.solution.setting && (
                <div className="mt-4 rounded-md bg-slate-100 px-3 py-2 font-mono text-xs text-slate-800">
                  {data.solution.setting}
                </div>
              )}
            </section>

            <section className="bg-white border border-slate-200 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-slate-950">Why this is a defensible reference answer</h2>
              <div className="mt-3 space-y-2">
                {(data.solution.explanation || []).map((line: string, index: number) => (
                  <div key={index} className="flex gap-2 text-sm leading-6 text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-slate-950">Common mistakes</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                {(data.commonMistakes || []).map((item: string, index: number) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-red-500">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-5">
            {data.expectedResults ? (
              <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200">
                  <h2 className="text-sm font-semibold text-slate-950">
                    {data.expectedResults.title || 'Expected results'}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {data.expectedResults.description}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        {(data.expectedResults.columns || []).map((column: any) => (
                          <th key={column.key} className="text-left px-4 py-3">
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(data.expectedResults.rows || []).map((row: any, index: number) => (
                        <tr key={row.id || index} className="align-top">
                          {(data.expectedResults.columns || []).map((column: any) => (
                            <td
                              key={column.key}
                              className={`px-4 py-3 ${
                                column.emphasis ? 'font-semibold text-slate-950' : 'text-slate-600'
                              }`}
                            >
                              {String(row[column.key] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : data.expectedCases ? (
              <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200">
                  <h2 className="text-sm font-semibold text-slate-950">Expected pull-request decisions</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Use these values to verify demonstrations and student interpretations.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="text-left px-4 py-3">Case</th>
                        <th className="text-left px-4 py-3">AI</th>
                        <th className="text-left px-4 py-3">Confidence</th>
                        <th className="text-left px-4 py-3">Evidence</th>
                        <th className="text-left px-4 py-3">AI-only</th>
                        <th className="text-left px-4 py-3">Guarded</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.expectedCases.map((row: any) => (
                        <tr key={row.id} className="align-top">
                          <td className="px-4 py-3 font-mono font-semibold">{row.id}</td>
                          <td className="px-4 py-3">{row.aiLabel} ({row.aiRiskProbability.toFixed(3)})</td>
                          <td className="px-4 py-3">{row.aiConfidence.toFixed(3)}</td>
                          <td className="px-4 py-3 max-w-xs">{row.engineeringEvidence}</td>
                          <td className="px-4 py-3 font-mono">{row.aiOnlyDecision}</td>
                          <td className="px-4 py-3 font-mono font-semibold">{row.guardedDecision}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            <section className="bg-white border border-slate-200 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-slate-950">Verification guide</h2>
              <div className="mt-3 divide-y divide-slate-100">
                {(data.verificationGuide || []).map((item: any) => (
                  <div key={item.name} className="py-3">
                    <div className="text-xs font-semibold text-slate-900">{item.name}</div>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{item.meaning}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="space-y-4">
            {data.engineeringDecision?.sampleReportSection && (
              <section className="bg-white border border-slate-200 rounded-lg p-5">
                <h2 className="text-sm font-semibold text-slate-950">
                  {data.engineeringDecision.sampleReportSection.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-700 whitespace-pre-line">
                  {data.engineeringDecision.sampleReportSection.content}
                </p>
              </section>
            )}
            {(data.sampleReport || []).map((section: any) => (
              <section key={section.title} className="bg-white border border-slate-200 rounded-lg p-5">
                <h2 className="text-sm font-semibold text-slate-950">{section.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-700 whitespace-pre-line">
                  {section.content}
                </p>
              </section>
            ))}
          </div>
        )}

        {activeTab === 'masters' && (
          <section className="bg-white border border-slate-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-slate-950">Why the lab is Master's level</h2>
            <div className="mt-4 space-y-3">
              {(data.mastersLevelRationale || []).map((item: string, index: number) => (
                <div key={index} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <GraduationCap className="w-4 h-4 mt-1 shrink-0 text-blue-900" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
