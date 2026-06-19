import { readFileSync } from 'node:fs';
import { computeStats } from '../../stats.js';
import type { BenchMetricRecord } from './format-jsonl.js';
import type { Fingerprint, RunReport, ScenarioReport } from './runner.js';

type ReportLikeScenario = ScenarioReport & { readonly tags?: readonly string[] };
type ReportLike = RunReport & { readonly scenarios: readonly ReportLikeScenario[] };

function isNestedRunReport(value: unknown): value is RunReport {
  return typeof value === 'object'
    && value !== null
    && (value as { kind?: unknown }).kind === 'bench.v2';
}

function isMetricRecord(value: unknown): value is BenchMetricRecord {
  return typeof value === 'object'
    && value !== null
    && (value as { kind?: unknown }).kind === 'bench.v2.metric'
    && typeof (value as { runId?: unknown }).runId === 'string'
    && typeof (value as { scenario?: unknown }).scenario === 'string'
    && typeof (value as { metric?: unknown }).metric === 'string';
}

function buildScenarioReport(
  scenarioId: string,
  records: readonly BenchMetricRecord[],
): ReportLikeScenario {
  const first = records[0];
  if (first == null) throw new Error(`flat bench report has no records for scenario ${scenarioId}`);
  const byMetric = new Map(records.map((record) => [record.metric, record.value] as const));
  function metric(key: string): number {
    const value = byMetric.get(key);
    if (value === undefined) throw new Error(`flat bench report is missing ${key} for scenario ${scenarioId}`);
    return value;
  }

  return {
    scenarioId,
    label: first.label,
    tags: first.tags,
    columns: first.columns,
    rows: first.rows,
    warmupFrames: first.warmupFrames,
    measureFrames: first.measureFrames,
    samples: [],
    nsPerFrameStats: {
      count: metric('ns_per_frame.count'),
      mean: metric('ns_per_frame.mean'),
      stddev: metric('ns_per_frame.stddev'),
      cov: metric('ns_per_frame.cov'),
      min: metric('ns_per_frame.min'),
      max: metric('ns_per_frame.max'),
      p50: metric('ns_per_frame.p50'),
      p90: metric('ns_per_frame.p90'),
      p99: metric('ns_per_frame.p99'),
    },
  };
}

export function metricRecordsToRunReport(records: readonly BenchMetricRecord[]): ReportLike {
  if (records.length === 0) {
    throw new Error('flat bench report has no records');
  }

  const first = records[0];
  if (first == null) throw new Error('flat bench report has no records');
  const runId = first.runId;
  const generatedAt = first.generatedAt;
  const commit = first.commit;
  const fingerprint: Fingerprint = first.fingerprint;

  for (const record of records) {
    if (record.runId !== runId) throw new Error('flat bench report contains multiple runIds');
    if (record.generatedAt !== generatedAt) throw new Error('flat bench report contains multiple generatedAt values');
    if (record.commit !== commit) throw new Error('flat bench report contains multiple commit values');
  }

  const grouped = new Map<string, BenchMetricRecord[]>();
  for (const record of records) {
    const group = grouped.get(record.scenario);
    if (group) group.push(record);
    else grouped.set(record.scenario, [record]);
  }

  const scenarios = [...grouped.entries()].map(([scenarioId, scenarioRecords]) =>
    buildScenarioReport(scenarioId, scenarioRecords));

  const sampleCounts = new Set(scenarios.map((scenario) => scenario.nsPerFrameStats.count));
  const [onlySampleCount] = sampleCounts;
  const paramsSamples = sampleCounts.size === 1 && onlySampleCount !== undefined
    ? onlySampleCount
    : computeStats([...sampleCounts]).max;

  return {
    kind: 'bench.v2',
    runId,
    generatedAt,
    commit,
    fingerprint,
    params: {
      samples: paramsSamples,
      warmupFrames: 'scenario-default',
      measureFrames: 'scenario-default',
    },
    scenarios,
  };
}

export function parseBenchReportText(text: string): ReportLike {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    throw new Error('empty bench report');
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!isNestedRunReport(parsed)) {
      throw new Error('invalid nested bench report');
    }
    return parsed;
  } catch {
    // Not one JSON object; fall through to JSONL parsing.
  }

  const records = trimmed
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as unknown);

  if (!records.every(isMetricRecord)) {
    throw new Error('invalid flat bench report');
  }

  return metricRecordsToRunReport(records);
}

export function readBenchReport(path: string): ReportLike {
  return parseBenchReportText(readFileSync(path, 'utf8'));
}
