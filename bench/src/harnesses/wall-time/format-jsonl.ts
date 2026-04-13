import type { Fingerprint, RunReport, ScenarioReport } from './runner.js';

export interface BenchMetricRecord {
  readonly kind: 'bench.v2.metric';
  readonly runId: string;
  readonly generatedAt: string;
  readonly commit: string | null;
  readonly scenario: string;
  readonly label: string;
  readonly tags: readonly string[];
  readonly metric: string;
  readonly value: number;
  readonly unit: 'ns' | 'count' | 'ratio';
  readonly columns: number;
  readonly rows: number;
  readonly warmupFrames: number;
  readonly measureFrames: number;
  readonly fingerprint: Fingerprint;
}

const METRIC_UNITS = {
  'ns_per_frame.count': 'count',
  'ns_per_frame.mean': 'ns',
  'ns_per_frame.stddev': 'ns',
  'ns_per_frame.cov': 'ratio',
  'ns_per_frame.min': 'ns',
  'ns_per_frame.max': 'ns',
  'ns_per_frame.p50': 'ns',
  'ns_per_frame.p90': 'ns',
  'ns_per_frame.p99': 'ns',
} as const satisfies Record<string, BenchMetricRecord['unit']>;

export function scenarioToMetricRecords(
  report: RunReport,
  scenario: ScenarioReport & { readonly tags?: readonly string[] },
): readonly BenchMetricRecord[] {
  const tags = scenario.tags ?? [];
  const metricValues = {
    'ns_per_frame.count': scenario.nsPerFrameStats.count,
    'ns_per_frame.mean': scenario.nsPerFrameStats.mean,
    'ns_per_frame.stddev': scenario.nsPerFrameStats.stddev,
    'ns_per_frame.cov': scenario.nsPerFrameStats.cov,
    'ns_per_frame.min': scenario.nsPerFrameStats.min,
    'ns_per_frame.max': scenario.nsPerFrameStats.max,
    'ns_per_frame.p50': scenario.nsPerFrameStats.p50,
    'ns_per_frame.p90': scenario.nsPerFrameStats.p90,
    'ns_per_frame.p99': scenario.nsPerFrameStats.p99,
  } as const satisfies Record<string, number>;

  return (Object.entries(metricValues) as Array<[keyof typeof metricValues, number]>).map(([metric, value]) => ({
    kind: 'bench.v2.metric',
    runId: report.runId,
    generatedAt: report.generatedAt,
    commit: report.commit,
    scenario: scenario.scenarioId,
    label: scenario.label,
    tags,
    metric,
    value,
    unit: METRIC_UNITS[metric],
    columns: scenario.columns,
    rows: scenario.rows,
    warmupFrames: scenario.warmupFrames,
    measureFrames: scenario.measureFrames,
    fingerprint: report.fingerprint,
  }));
}

export function reportToMetricRecords(
  report: RunReport & { readonly scenarios: readonly (ScenarioReport & { readonly tags?: readonly string[] })[] },
): readonly BenchMetricRecord[] {
  return report.scenarios.flatMap((scenario) => scenarioToMetricRecords(report, scenario));
}

export function formatReportAsJsonl(
  report: RunReport & { readonly scenarios: readonly (ScenarioReport & { readonly tags?: readonly string[] })[] },
): string {
  return reportToMetricRecords(report)
    .map((record) => JSON.stringify(record))
    .join('\n') + '\n';
}
