/**
 * Wall-time harness — report comparison.
 *
 * Diffs two bench.v2 run reports and produces a per-scenario delta
 * table. Used for "before vs after" optimization measurement and as
 * a future CI regression gate.
 */

import type { RunReport } from './runner.js';
import { formatNs } from '../../stats.js';

export interface ScenarioDelta {
  readonly scenarioId: string;
  readonly label: string;
  readonly baselineMedianNs: number;
  readonly currentMedianNs: number;
  readonly deltaNs: number;
  readonly deltaPct: number;
  readonly baselineCoV: number;
  readonly currentCoV: number;
  readonly status: 'improved' | 'similar' | 'regressed';
}

export interface ComparisonReport {
  readonly baselineCommit: string | null;
  readonly currentCommit: string | null;
  readonly machineMatches: boolean;
  readonly scenarios: readonly ScenarioDelta[];
}

export function compareReports(
  baseline: RunReport,
  current: RunReport,
  options: { readonly similarThresholdPct?: number } = {},
): ComparisonReport {
  const similarThresholdPct = options.similarThresholdPct ?? 5;

  const baselineById = new Map(baseline.scenarios.map((s) => [s.scenarioId, s] as const));
  const deltas: ScenarioDelta[] = [];

  for (const cur of current.scenarios) {
    const base = baselineById.get(cur.scenarioId);
    if (!base) continue;
    const baseNs = base.nsPerFrameStats.p50;
    const curNs = cur.nsPerFrameStats.p50;
    const deltaNs = curNs - baseNs;
    const deltaPct = baseNs !== 0 ? (deltaNs / baseNs) * 100 : 0;
    let status: ScenarioDelta['status'];
    if (Math.abs(deltaPct) <= similarThresholdPct) {
      status = 'similar';
    } else if (deltaPct < 0) {
      status = 'improved';
    } else {
      status = 'regressed';
    }
    deltas.push({
      scenarioId: cur.scenarioId,
      label: cur.label,
      baselineMedianNs: baseNs,
      currentMedianNs: curNs,
      deltaNs,
      deltaPct,
      baselineCoV: base.nsPerFrameStats.cov,
      currentCoV: cur.nsPerFrameStats.cov,
      status,
    });
  }

  return {
    baselineCommit: baseline.commit,
    currentCommit: current.commit,
    machineMatches:
      baseline.fingerprint.cpuModel === current.fingerprint.cpuModel &&
      baseline.fingerprint.arch === current.fingerprint.arch &&
      baseline.fingerprint.nodeVersion === current.fingerprint.nodeVersion,
    scenarios: deltas,
  };
}

export function formatComparison(report: ComparisonReport): string {
  const lines: string[] = [];
  lines.push(`baseline commit: ${report.baselineCommit ?? 'unknown'}`);
  lines.push(`current commit:  ${report.currentCommit ?? 'unknown'}`);
  if (!report.machineMatches) {
    lines.push('WARNING: machine fingerprint mismatch — treat results as informational, not as a regression gate.');
  }
  lines.push('');
  lines.push('| Scenario | Baseline p50 | Current p50 | Δ | Status |');
  lines.push('|---|---|---|---|---|');
  for (const d of report.scenarios) {
    const sign = d.deltaPct >= 0 ? '+' : '';
    const statusTag = d.status === 'improved' ? 'GOOD' : d.status === 'regressed' ? 'REGRESS' : 'ok';
    lines.push(
      `| ${d.scenarioId} | ${formatNs(d.baselineMedianNs)} | ${formatNs(d.currentMedianNs)} | ${sign}${d.deltaPct.toFixed(1)}% | ${statusTag} |`,
    );
  }
  return lines.join('\n');
}
