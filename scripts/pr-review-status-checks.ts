import type { CheckEntry, CheckSummary } from './pr-review-status-contract.js';

export function summarizeChecks(checks: readonly CheckEntry[]): CheckSummary {
  const counts: Record<string, number> = {
    pass: 0,
    fail: 0,
    pending: 0,
    skipping: 0,
    cancel: 0,
    other: 0,
  };
  for (const check of checks) {
    if (check.bucket in counts) {
      counts[check.bucket] = (counts[check.bucket] ?? 0) + 1;
    } else {
      counts.other = (counts.other ?? 0) + 1;
    }
  }
  return {
    counts,
    failing: checks.filter((check) => check.bucket === 'fail'),
    pending: checks.filter((check) => check.bucket === 'pending'),
    canceled: checks.filter((check) => check.bucket === 'cancel'),
    codeRabbit: checks.find((check) => check.name === 'CodeRabbit') ?? null,
  };
}

export function computeExitCode(
  summary: CheckSummary,
  unresolvedCount: number,
): number {
  if (
    summary.failing.length > 0 ||
    summary.canceled.length > 0 ||
    unresolvedCount > 0
  )
    return 1;
  return summary.pending.length > 0 ? 8 : 0;
}
