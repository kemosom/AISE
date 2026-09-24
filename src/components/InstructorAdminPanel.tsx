import React, { useState } from 'react';
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
}

type AdminTab = 'guide' | 'alignment' | 'solution' | 'results' | 'report' | 'masters';

export const InstructorAdminPanel: React.FC<InstructorAdminPanelProps> = ({
  data,
  onExit,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('guide');
  const [copied, setCopied] = useState(false);

  const copySolution = async () => {
    await navigator.clipboard.writeText(
      `${data.solution.code}\n\n${data.solution.setting}`
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
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
              <ShieldCheck className="w-4 h-4" />
              Instructor only
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
            {data.teachingSteps.map((item: any) => (
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
                <h2 className="text-sm font-semibold text-slate-950">Lab 01 CLO/PLO contribution</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Use this to explain the academic purpose of the lab and avoid over-claiming alignment.
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
                        {item.studentEvidence.map((evidence: string) => (
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
                  Recommended answer: {data.engineeringDecision.recommendedStrategy}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="text-left px-4 py-3">Criterion</th>
                      <th className="text-left px-4 py-3">A: Direct AI</th>
                      <th className="text-left px-4 py-3">B: Policy in model</th>
                      <th className="text-left px-4 py-3">C: Separated</th>
                      <th className="text-left px-4 py-3">Instructor rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.engineeringDecision.comparison.map((row: any) => (
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
              <p className="mt-3 text-sm leading-7 text-slate-700">
                {data.engineeringDecision.sampleAnswer}
              </p>

              <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Marking indicators
              </h3>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                {data.engineeringDecision.markingIndicators.map((item: string) => (
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
                  {data.courseWideRule.points.map((item: string) => (
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

        {activeTab === 'solution' && (
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

              <div className="mt-4 rounded-md bg-slate-100 px-3 py-2 font-mono text-xs text-slate-800">
                {data.solution.setting}
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-slate-950">Why this answer is correct</h2>
              <div className="mt-3 space-y-2">
                {data.solution.explanation.map((line: string, index: number) => (
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
                {data.commonMistakes.map((item: string, index: number) => (
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

            <section className="bg-white border border-slate-200 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-slate-950">Verification guide</h2>
              <div className="mt-3 divide-y divide-slate-100">
                {data.verificationGuide.map((item: any) => (
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
            {data.sampleReport.map((section: any) => (
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
              {data.mastersLevelRationale.map((item: string, index: number) => (
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
