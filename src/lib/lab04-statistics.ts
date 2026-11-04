import type { RepairRun } from './lab04-engine';

export const LAB04_ISSUE_IDS = ['checkout', 'queue', 'security'] as const;
export type Lab04Strategy = RepairRun['strategy'];

export function isCompletedRepair(row: RepairRun): boolean {
  // A failed test is part of the experiment. A failed API/compiler service is not.
  return row.status === 'Resolved' || row.status === 'Unresolved';
}

export type Lab04Group = {
  n: number; successes: number; failures: number; successRate: number | null;
  meanMs: number | null; meanToolMessages: number | null;
  meanToolBytes: number | null; meanTokens: number | null; meanModelCalls: number | null;
  meanAttempts: number | null;
};

export function summarizeLab04Group(rows: RepairRun[]): Lab04Group {
  const valid = rows.filter(isCompletedRepair);
  const n = valid.length;
  const sum = (field: keyof RepairRun) =>
    valid.reduce((value, row) => value + Number(row[field] || 0), 0);
  const successes = valid.filter((row) => row.success).length;
  return {
    n, successes, failures: n - successes,
    successRate: n ? (100 * successes) / n : null,
    meanMs: n ? sum('elapsedMs') / n : null,
    meanToolMessages: n ? sum('toolMessages') / n : null,
    meanToolBytes: n ? sum('toolBytes') / n : null,
    meanTokens: n ? sum('modelTokens') / n : null,
    meanModelCalls: n ? sum('modelCalls') / n : null,
    meanAttempts: n ? sum('attempts') / n : null,
  };
}

export function summarizeLab04(rows: RepairRun[]) {
  const strategies: Lab04Strategy[] = ['reactive', 'intelligent'];
  const overall = Object.fromEntries(strategies.map((strategy) => [
    strategy, summarizeLab04Group(rows.filter((r) => r.strategy === strategy)),
  ])) as Record<Lab04Strategy, Lab04Group>;
  const perIssue = LAB04_ISSUE_IDS.map((issue) => ({
    issue,
    reactive: summarizeLab04Group(rows.filter((r) => r.issue === issue && r.strategy === 'reactive')),
    intelligent: summarizeLab04Group(rows.filter((r) => r.issue === issue && r.strategy === 'intelligent')),
  }));
  return {
    overall,
    perIssue,
    validCount: rows.filter(isCompletedRepair).length,
    errorCount: rows.filter((r) => !isCompletedRepair(r)).length,
    totalCount: rows.length,
  };
}

export function formatLab04Number(value: number | null, digits = 0): string {
  return value === null || !Number.isFinite(value) ? 'No completed trials' : value.toFixed(digits);
}
