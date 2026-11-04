import React from 'react';
import { AlertCircle, Download, RotateCcw } from 'lucide-react';
import type { RepairRun } from '../lib/lab04-engine';
import {
  formatLab04Number, isCompletedRepair, summarizeLab04,
  type Lab04Group, type Lab04Strategy,
} from '../lib/lab04-statistics';

type Props = {
  rows: RepairRun[];
  onClear: () => void;
  busy?: boolean;
  onCsv: () => void;
  onTraces: () => void;
};

const names: Lab04Strategy[] = ['reactive', 'intelligent'];
const format = (value: number | null, suffix = '', digits = 0) =>
  value === null ? '—' : value.toFixed(digits) + suffix;

function ComparisonFigure({ title, subtitle, values, unit, digits = 0 }: {
  title: string; subtitle: string; values: Record<Lab04Strategy, number | null>;
  unit: string; digits?: number;
}) {
  const maximum = Math.max(1, ...names.map((name) => values[name] ?? 0));
  const positions = [105, 282];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>
      <svg className="mt-4 w-full" viewBox="0 0 440 214" role="img" aria-label={title + ': reactive versus intelligent'}>
        {[0, 0.5, 1].map((fraction) => {
          const y = 162 - 125 * fraction;
          return <line key={fraction} x1="44" y1={y} x2="420" y2={y} stroke="#e2e8f0" strokeDasharray="3 4" />;
        })}
        <line x1="44" x2="420" y1="162" y2="162" stroke="#94a3b8" />
        {names.map((strategy, i) => {
          const value = values[strategy], x = positions[i];
          const barHeight = value === null ? 0 : Math.max(value > 0 ? 2 : 0, 125 * value / maximum);
          return <g key={strategy}>
            <rect x={x} y={162 - barHeight} width="80" height={barHeight}
              rx="4" fill={i === 0 ? '#2563eb' : '#0f766e'} />
            <text x={x + 40} y={Math.max(18, 155 - barHeight)} fontSize="12" textAnchor="middle"
              fill="#0f172a" fontWeight="600">
              {value === null ? 'N/A' : value.toFixed(digits) + ' ' + unit}
            </text>
            <text x={x + 40} y="183" fontSize="12" textAnchor="middle" fill="#334155">{strategy}</text>
          </g>;
        })}
      </svg>
    </div>
  );
}

function PerIssueFigure({ rows }: { rows: RepairRun[] }) {
  const summary = summarizeLab04(rows);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <h4 className="text-sm font-semibold">Repair success by defect</h4>
      <p className="mt-1 text-xs text-slate-500">Each bar uses completed trials for that issue and strategy. Empty groups are labelled N/A.</p>
      <svg className="mt-4 w-full" viewBox="0 0 690 225" role="img" aria-label="Per-issue repair success rates">
        {[0, 50, 100].map((percent) => {
          const y = 168 - (percent / 100) * 118;
          return <g key={percent}>
            <line x1="52" x2="663" y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="3 4"/>
            <text x="47" y={y + 4} textAnchor="end" fill="#64748b" fontSize="10">{percent}%</text>
          </g>;
        })}
        {summary.perIssue.map((entry, i) =>
          names.map((name, j) => {
            const group = entry[name], x = 120 + i * 204 + j * 62;
            const barHeight = 118 * (group.successRate || 0) / 100;
            return <g key={entry.issue + name}>
              <rect x={x} y={168 - barHeight} width="48" height={barHeight} rx="3"
                fill={j === 0 ? '#2563eb' : '#0f766e'}/>
              <text x={x + 24} y={Math.max(20, 160 - barHeight)} textAnchor="middle"
                fontSize="11" fontWeight="600" fill="#0f172a">
                {group.successRate === null ? 'N/A' : group.successRate.toFixed(0) + '%'}
              </text>
              <text x={x + 24} y="185" fontSize="10" textAnchor="middle" fill="#475569">
                {j === 0 ? 'Reactive' : 'Intelligent'}
              </text>
            </g>;
          })
        )}
        {summary.perIssue.map((entry,i) => <text key={entry.issue} x={175+i*204} y="207"
          fontSize="12" fontWeight="600" textAnchor="middle" fill="#0f172a">{entry.issue}</text>)}
      </svg>
    </div>
  );
}

function SummaryCell({ group, field, digits = 0 }: { group: Lab04Group; field: keyof Lab04Group; digits?: number }) {
  const value = group[field];
  return <>{typeof value === 'number' ? value.toFixed(digits) : '—'}</>;
}

export const Lab04Analysis: React.FC<Props> = ({ rows, onClear, onCsv, onTraces, busy }) => {
  const summary = summarizeLab04(rows);
  const reactive = summary.overall.reactive, intelligent = summary.overall.intelligent;
  const fullyObservedIssues = summary.perIssue.filter((item) => item.reactive.n > 0 && item.intelligent.n > 0).length;
  const recoveredAfterRetry = rows.filter((item) => isCompletedRepair(item) && item.success && item.attempts > 1).length;
  const allFirstPass = summary.validCount > 0 &&
    rows.filter(isCompletedRepair).every((item) => item.success && item.attempts === 1);
  return (
    <section className="mb-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-blue-700">PART E · EXPERIMENTAL RESULTS</p>
          <h3 className="mt-1 text-lg font-semibold">09. Analyse software repair performance</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Compare successful repairs, execution time, tool-worker communication and model use.
            Figures and tables are calculated from recorded experiment executions.
          </p>
        </div>
        <button type="button" onClick={onClear} disabled={busy || !rows.length}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40">
          <RotateCcw className="h-3.5 w-3.5"/> Clear measurements
        </button>
      </div>
      {rows.length > 0 && (
        <div className={'mt-4 rounded-lg border p-3 text-xs leading-5 ' +
          (summary.errorCount ? 'border-amber-200 bg-amber-50 text-amber-950' : 'border-slate-200 bg-slate-50 text-slate-700')}>
          <strong>{summary.validCount} completed repair trials.</strong>
          {' '}{summary.errorCount} API or execution errors excluded from repair success rates and means.
          {' '}A successful repair must compile and pass every regression test. An unresolved trial completed normally but did not pass.
          {' '}An API error is not a software repair failure.
        </div>
      )}
      {summary.validCount > 0 && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700">
          <div className="text-sm font-semibold text-slate-900">How to interpret these measurements</div>
          {fullyObservedIssues < 3 ? (
            <p className="mt-1">
              Only {fullyObservedIssues} of 3 defects have completed trials for both strategies.
              The overall success percentages are preliminary. Complete queue and security before
              comparing agent performance across the full set of cases.
            </p>
          ) : allFirstPass ? (
            <p className="mt-1">
              Both agents repaired every observed defect on their first patch. The intelligent agent
              did not need to revise any generated code in these trials. This is a ceiling effect,
              not proof that the agents have identical capabilities. Compare runtime and model use,
              then repeat the experiment if additional observations are needed.
            </p>
          ) : (
            <p className="mt-1">
              {recoveredAfterRetry} successful repairs required more than one patch attempt.
              Examine their execution traces to see whether test feedback contributed to the
              repair. Compare success and overhead per issue, not only the overall percentages.
            </p>
          )}
          <p className="mt-1">
            Observed feedback-driven recoveries: <strong>{recoveredAfterRetry}</strong>.
            Completed trials are counted separately from provider and execution errors.
          </p>
        </div>
      )}
      <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600"><tr>
            {['Issue','Agent','Outcome','Patches','Time (ms)','Worker msgs','Worker bytes','Model tokens','Trace'].map((label) =>
              <th className="whitespace-nowrap border-b border-slate-200 px-3 py-3 font-semibold" key={label}>{label}</th>)}
          </tr></thead>
          <tbody>{rows.length ? rows.map((row, i) => {
            const completed = isCompletedRepair(row);
            return <tr key={i} className="border-t border-slate-100">
              <td className="px-3 py-2">{row.issue}</td>
              <td className="px-3 py-2 capitalize">{row.strategy}</td>
              <td className={'whitespace-nowrap px-3 py-2 font-semibold ' +
                (row.success && completed ? 'text-emerald-700' : completed ? 'text-red-700' : 'text-amber-700')}>
                {completed ? (row.success ? 'Resolved' : 'Unresolved') : 'Error'}
              </td>
              <td className="px-3 py-2">{row.attempts}</td>
              <td className="px-3 py-2">{row.elapsedMs.toLocaleString()}</td>
              <td className="px-3 py-2">{row.toolMessages}</td>
              <td className="px-3 py-2">{row.toolBytes.toLocaleString()}</td>
              <td className="px-3 py-2">{row.modelTokens.toLocaleString()}</td>
              <td className="px-3 py-2">
                <details className="max-w-[400px]">
                  <summary className="cursor-pointer whitespace-nowrap font-semibold text-blue-700">View</summary>
                  <pre className="mt-2 max-h-64 w-[370px] max-w-full overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] leading-5 text-slate-700">
                    {row.trace.join('\n\n')}
                  </pre>
                </details>
              </td>
            </tr>;
          }) : <tr><td colSpan={9} className="px-4 py-7 text-center text-slate-500">
            No experiment records yet. Run both agents on a selected defect to produce the first comparison.
          </td></tr>}</tbody>
        </table>
      </div>

      {summary.validCount > 0 && (
        <>
          <h4 className="mt-7 text-sm font-semibold">Overall strategy comparison</h4>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Descriptive measurements from {summary.validCount} completed trials, not a statistical significance test.
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <ComparisonFigure title="Repair success rate" subtitle="Successful fixes / completed trials"
              unit="%" digits={1} values={{reactive:reactive.successRate,intelligent:intelligent.successRate}}/>
            <ComparisonFigure title="Mean end-to-end time" subtitle="Including model requests, compilation and tests"
              unit="s" digits={2} values={{reactive:reactive.meanMs===null?null:reactive.meanMs/1000,
                intelligent:intelligent.meanMs===null?null:intelligent.meanMs/1000}}/>
            <ComparisonFigure title="Mean test-worker communication" subtitle="Serialized JSON bytes exchanged with the test worker"
              unit="bytes" values={{reactive:reactive.meanToolBytes,intelligent:intelligent.meanToolBytes}}/>
            <ComparisonFigure title="Mean model token consumption" subtitle="Gemini input, visible output and thinking tokens per completed run"
              unit="tokens" values={{reactive:reactive.meanTokens,intelligent:intelligent.meanTokens}}/>
          </div>

          <h4 className="mt-7 text-sm font-semibold">Per-issue breakdown</h4>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Cases with no valid trial remain N/A. Try repetitions to observe run-to-run variation.
            A one-run success rate is descriptive, not a generalizable performance estimate.
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Checkout checks type correctness. Queue checks incident dispatch order. Security checks sensitive-header redaction.
          </p>
          <div className="mt-4"><PerIssueFigure rows={rows}/></div>
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600"><tr>
                {['Issue', 'Strategy', 'Solved / N', 'Success %', 'Mean time (s)', 'Mean model calls', 'Mean tokens', 'Mean worker bytes'].map((label) =>
                  <th key={label} className="whitespace-nowrap border-b border-slate-200 px-3 py-3 font-semibold">{label}</th>)}
              </tr></thead>
              <tbody>{summary.perIssue.flatMap((entry) => names.map((strategy) => {
                const group = entry[strategy];
                return <tr key={entry.issue+strategy} className="border-t border-slate-100">
                  <td className="px-3 py-3 font-semibold">{entry.issue}</td>
                  <td className="px-3 py-3 capitalize">{strategy}</td>
                  <td className="whitespace-nowrap px-3 py-3">{group.n ? group.successes+' / '+group.n : '—'}</td>
                  <td className="px-3 py-3"><SummaryCell group={group} field="successRate" digits={1}/></td>
                  <td className="px-3 py-3">{group.meanMs===null?'—':(group.meanMs/1000).toFixed(2)}</td>
                  <td className="px-3 py-3"><SummaryCell group={group} field="meanModelCalls" digits={1}/></td>
                  <td className="px-3 py-3"><SummaryCell group={group} field="meanTokens" digits={0}/></td>
                  <td className="px-3 py-3"><SummaryCell group={group} field="meanToolBytes" digits={0}/></td>
                </tr>;
              }))}</tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Worker bytes exclude model API traffic. Failed builds may not contact the worker, so zero worker bytes
            does not mean zero communication or zero computation.
          </p>
        </>
      )}
      {rows.length > 0 && summary.validCount === 0 &&
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0"/>
          No completed repair trials can be analysed yet. Inspect the errors above and rerun the affected cases.
          The charts are not generated from API or execution failures.
        </div>}
      <div className="mt-5 flex flex-wrap gap-2">
        <button disabled={!rows.length} onClick={onCsv}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold disabled:opacity-40">
          <Download className="h-4 w-4"/> Export experiment CSV
        </button>
        <button disabled={!rows.length} onClick={onTraces}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold disabled:opacity-40">
          <Download className="h-4 w-4"/> Export complete JSON traces
        </button>
      </div>
    </section>
  );
};
