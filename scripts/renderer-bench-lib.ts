import os from 'node:os';

export type RendererBenchKind = 'render' | 'diff' | 'surface' | 'normalize' | 'styled-diff';

export interface RendererBenchScenario {
  readonly id: string;
  readonly label: string;
  readonly kind: RendererBenchKind;
  readonly columns: number;
  readonly rows: number;
  readonly frames: number;
  readonly warmupFrames: number;
}

export interface RendererBenchEnvironment {
  readonly platform: NodeJS.Platform;
  readonly arch: string;
  readonly release: string;
  readonly nodeVersion: string;
  readonly cpuModel: string;
  readonly cpuCount: number;
  readonly totalMemoryBytes: number;
  readonly hostname: string;
  readonly gitCommit: string | null;
  readonly gcExposed: boolean;
}

export interface RendererBenchSample {
  readonly elapsedMs: number;
  readonly avgFrameMs: number;
  readonly approxFps: number;
  readonly writes?: number;
  readonly bytesWritten?: number;
  readonly transientHeapDelta?: number;
  readonly retainedHeapDelta?: number;
}

export interface RendererBenchScenarioResult {
  readonly scenario: RendererBenchScenario;
  readonly samples: readonly RendererBenchSample[];
  readonly medianElapsedMs: number;
  readonly medianAvgFrameMs: number;
  readonly medianApproxFps: number;
  readonly medianWrites?: number;
  readonly medianBytesWritten?: number;
  readonly medianTransientHeapDelta?: number;
  readonly medianRetainedHeapDelta?: number;
}

export interface RendererBenchReport {
  readonly kind: 'renderer-bench.v1';
  readonly generatedAt: string;
  readonly sampleCount: number;
  readonly environment: RendererBenchEnvironment;
  readonly scenarios: readonly RendererBenchScenarioResult[];
}

export interface RendererBenchComparisonRow {
  readonly scenarioId: string;
  readonly label: string;
  readonly baselineAvgFrameMs: number;
  readonly currentAvgFrameMs: number;
  readonly deltaAvgFrameMs: number;
  readonly deltaPct: number;
  readonly status: 'improved' | 'similar' | 'regressed';
}

export interface RendererBenchComparison {
  readonly machineMatches: boolean;
  readonly fingerprint: string;
  readonly baselineFingerprint: string;
  readonly rows: readonly RendererBenchComparisonRow[];
}

export const DEFAULT_RENDERER_BENCH_SCENARIOS: readonly RendererBenchScenario[] = [
  {
    id: 'dogfood.render.medium',
    label: 'DOGFOOD landing render (220x58)',
    kind: 'render',
    columns: 220,
    rows: 58,
    frames: 240,
    warmupFrames: 30,
  },
  {
    id: 'dogfood.diff.medium',
    label: 'DOGFOOD landing render+diff (220x58)',
    kind: 'diff',
    columns: 220,
    rows: 58,
    frames: 180,
    warmupFrames: 20,
  },
  {
    id: 'dogfood.render.large',
    label: 'DOGFOOD landing render (271x71)',
    kind: 'render',
    columns: 271,
    rows: 71,
    frames: 180,
    warmupFrames: 20,
  },
  {
    id: 'dogfood.diff.large',
    label: 'DOGFOOD landing render+diff (271x71)',
    kind: 'diff',
    columns: 271,
    rows: 71,
    frames: 120,
    warmupFrames: 15,
  },
  {
    id: 'surface.paint.medium',
    label: 'Synthetic surface paint (220x58)',
    kind: 'surface',
    columns: 220,
    rows: 58,
    frames: 240,
    warmupFrames: 20,
  },
  {
    id: 'layout.normalize.medium',
    label: 'Synthetic layout normalize (220x58)',
    kind: 'normalize',
    columns: 220,
    rows: 58,
    frames: 240,
    warmupFrames: 20,
  },
  {
    id: 'styled.diff.medium',
    label: 'Synthetic styled diff (220x58)',
    kind: 'styled-diff',
    columns: 220,
    rows: 58,
    frames: 180,
    warmupFrames: 15,
  },
] as const;

export function median(values: readonly number[]): number {
  if (values.length === 0) {
    throw new Error('median requires at least one value');
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[middle]!;
  }
  return (sorted[middle - 1]! + sorted[middle]!) / 2;
}

export function summarizeScenarioResult(
  scenario: RendererBenchScenario,
  samples: readonly RendererBenchSample[],
): RendererBenchScenarioResult {
  const writes = samples.map((sample) => sample.writes).filter((value): value is number => value != null);
  const bytesWritten = samples.map((sample) => sample.bytesWritten).filter((value): value is number => value != null);
  const transientHeapDelta = samples.map((sample) => sample.transientHeapDelta).filter((value): value is number => value != null);
  const retainedHeapDelta = samples.map((sample) => sample.retainedHeapDelta).filter((value): value is number => value != null);

  return {
    scenario,
    samples,
    medianElapsedMs: median(samples.map((sample) => sample.elapsedMs)),
    medianAvgFrameMs: median(samples.map((sample) => sample.avgFrameMs)),
    medianApproxFps: median(samples.map((sample) => sample.approxFps)),
    medianWrites: writes.length > 0 ? median(writes) : undefined,
    medianBytesWritten: bytesWritten.length > 0 ? median(bytesWritten) : undefined,
    medianTransientHeapDelta: transientHeapDelta.length > 0 ? median(transientHeapDelta) : undefined,
    medianRetainedHeapDelta: retainedHeapDelta.length > 0 ? median(retainedHeapDelta) : undefined,
  };
}

export function detectRendererBenchEnvironment(gitCommit: string | null): RendererBenchEnvironment {
  const cpus = os.cpus();
  return {
    platform: process.platform,
    arch: process.arch,
    release: os.release(),
    nodeVersion: process.version,
    cpuModel: cpus[0]?.model ?? 'unknown',
    cpuCount: cpus.length,
    totalMemoryBytes: os.totalmem(),
    hostname: os.hostname(),
    gitCommit,
    gcExposed: typeof global.gc === 'function',
  };
}

export function benchmarkFingerprint(environment: RendererBenchEnvironment): string {
  return [
    environment.platform,
    environment.arch,
    environment.release,
    environment.nodeVersion,
    environment.cpuModel,
    String(environment.cpuCount),
    String(environment.totalMemoryBytes),
    environment.hostname,
  ].join(' | ');
}

export function compareRendererBenchReports(
  baseline: RendererBenchReport,
  current: RendererBenchReport,
  options: {
    readonly similarThresholdPct?: number;
  } = {},
): RendererBenchComparison {
  if (baseline.kind !== current.kind) {
    throw new Error(`benchmark kind mismatch: ${baseline.kind} vs ${current.kind}`);
  }

  const similarThresholdPct = options.similarThresholdPct ?? 5;
  const baselineById = new Map(baseline.scenarios.map((entry) => [entry.scenario.id, entry] as const));

  const rows: RendererBenchComparisonRow[] = current.scenarios.map((entry) => {
    const base = baselineById.get(entry.scenario.id);
    if (base == null) {
      throw new Error(`baseline is missing scenario ${entry.scenario.id}`);
    }
    const deltaAvgFrameMs = entry.medianAvgFrameMs - base.medianAvgFrameMs;
    const deltaPct = base.medianAvgFrameMs === 0 ? 0 : (deltaAvgFrameMs / base.medianAvgFrameMs) * 100;
    let status: RendererBenchComparisonRow['status'];
    if (Math.abs(deltaPct) <= similarThresholdPct) {
      status = 'similar';
    } else if (deltaPct < 0) {
      status = 'improved';
    } else {
      status = 'regressed';
    }
    return {
      scenarioId: entry.scenario.id,
      label: entry.scenario.label,
      baselineAvgFrameMs: base.medianAvgFrameMs,
      currentAvgFrameMs: entry.medianAvgFrameMs,
      deltaAvgFrameMs,
      deltaPct,
      status,
    };
  });

  return {
    machineMatches: benchmarkFingerprint(baseline.environment) === benchmarkFingerprint(current.environment),
    fingerprint: benchmarkFingerprint(current.environment),
    baselineFingerprint: benchmarkFingerprint(baseline.environment),
    rows,
  };
}

export function formatRendererBenchSummary(report: RendererBenchReport): string {
  const lines: string[] = [];
  lines.push(`renderer-bench (${report.sampleCount} samples)`);
  lines.push(`machine: ${benchmarkFingerprint(report.environment)}`);
  for (const entry of report.scenarios) {
    lines.push(
      [
        `- ${entry.scenario.label}`,
        `median ${entry.medianAvgFrameMs.toFixed(3)} ms/frame`,
        `${entry.medianApproxFps.toFixed(1)} fps`,
        entry.medianWrites != null ? `${entry.medianWrites.toFixed(0)} writes` : undefined,
        entry.medianTransientHeapDelta != null ? `${Math.round(entry.medianTransientHeapDelta / 1024)} KiB transient heap` : undefined,
      ].filter(Boolean).join(' • '),
    );
  }
  return lines.join('\n');
}

export function formatRendererBenchComparison(
  comparison: RendererBenchComparison,
  options: {
    readonly warnThresholdPct?: number;
    readonly failThresholdPct?: number;
  } = {},
): string {
  const warnThresholdPct = options.warnThresholdPct ?? 10;
  const failThresholdPct = options.failThresholdPct ?? 20;
  const lines: string[] = [];
  lines.push(`current machine: ${comparison.fingerprint}`);
  lines.push(`baseline machine: ${comparison.baselineFingerprint}`);
  if (!comparison.machineMatches) {
    lines.push('machine fingerprint mismatch: treat this comparison as informational, not as a regression gate.');
  }
  for (const row of comparison.rows) {
    const severity = row.deltaPct >= failThresholdPct
      ? 'FAIL'
      : row.deltaPct >= warnThresholdPct
        ? 'WARN'
        : row.status === 'improved'
          ? 'GOOD'
          : 'OK';
    const sign = row.deltaPct >= 0 ? '+' : '';
    lines.push(
      `${severity} ${row.label}: ${row.currentAvgFrameMs.toFixed(3)} ms/frame vs ${row.baselineAvgFrameMs.toFixed(3)} ms/frame (${sign}${row.deltaPct.toFixed(1)}%)`,
    );
  }
  return lines.join('\n');
}
