import { describe, expect, it } from 'vitest';
import { formatReportAsJsonl } from './format-jsonl.js';
import { parseBenchReportText } from './read-report.js';
import type { RunReport } from './runner.js';

const FIXTURE: RunReport & {
  readonly scenarios: readonly [{
    readonly scenarioId: 'paint-gradient-rgb';
    readonly label: 'Paint gradient';
    readonly tags: readonly ['paint', 'gradient'];
    readonly columns: 220;
    readonly rows: 58;
    readonly warmupFrames: 30;
    readonly measureFrames: 200;
    readonly samples: readonly [];
    readonly nsPerFrameStats: {
      readonly count: 30;
      readonly mean: 910000;
      readonly stddev: 20000;
      readonly cov: 0.02197802197802198;
      readonly min: 880000;
      readonly max: 950000;
      readonly p50: 900000;
      readonly p90: 940000;
      readonly p99: 949000;
    };
  }];
} = {
  kind: 'bench.v2',
  runId: 'run-123',
  generatedAt: '2026-04-13T00:00:00.000Z',
  commit: 'abc1234',
  fingerprint: {
    platform: 'darwin',
    arch: 'arm64',
    release: '24.0.0',
    nodeVersion: 'v25.0.0',
    cpuModel: 'Test CPU',
    cpuCount: 8,
    totalMemoryBytes: 1024,
    hostname: 'bench-host',
  },
  params: {
    samples: 30,
    warmupFrames: 'scenario-default',
    measureFrames: 'scenario-default',
  },
  scenarios: [{
    scenarioId: 'paint-gradient-rgb',
    label: 'Paint gradient',
    tags: ['paint', 'gradient'],
    columns: 220,
    rows: 58,
    warmupFrames: 30,
    measureFrames: 200,
    samples: [],
    nsPerFrameStats: {
      count: 30,
      mean: 910000,
      stddev: 20000,
      cov: 0.02197802197802198,
      min: 880000,
      max: 950000,
      p50: 900000,
      p90: 940000,
      p99: 949000,
    },
  }],
};

describe('flat bench report formatting', () => {
  it('formats one JSONL record per scenario metric', () => {
    const lines = formatReportAsJsonl(FIXTURE).trim().split('\n').map((line) => JSON.parse(line));
    expect(lines).toHaveLength(9);
    expect(lines[0]).toMatchObject({
      kind: 'bench.v2.metric',
      runId: 'run-123',
      scenario: 'paint-gradient-rgb',
      metric: 'ns_per_frame.count',
      value: 30,
      unit: 'count',
      tags: ['paint', 'gradient'],
    });
    expect(lines.at(-1)).toMatchObject({
      metric: 'ns_per_frame.p99',
      value: 949000,
      unit: 'ns',
    });
  });

  it('round-trips flat JSONL back into a run report for compare flows', () => {
    const text = formatReportAsJsonl(FIXTURE);
    const parsed = parseBenchReportText(text);
    expect(parsed.runId).toBe('run-123');
    expect(parsed.commit).toBe('abc1234');
    expect(parsed.scenarios[0]).toMatchObject({
      scenarioId: 'paint-gradient-rgb',
      label: 'Paint gradient',
      tags: ['paint', 'gradient'],
    });
    expect(parsed.scenarios[0]!.nsPerFrameStats).toMatchObject({
      count: 30,
      p50: 900000,
      p99: 949000,
      cov: 0.02197802197802198,
    });
  });

  it('preserves nested bench.v2 parsing', () => {
    const parsed = parseBenchReportText(JSON.stringify(FIXTURE));
    expect(parsed).toMatchObject({
      kind: 'bench.v2',
      runId: 'run-123',
      scenarios: [{ scenarioId: 'paint-gradient-rgb' }],
    });
  });
});
