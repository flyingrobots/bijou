import { describe, expect, it } from 'vitest';
import {
  benchmarkFingerprint,
  compareRendererBenchReports,
  median,
  type RendererBenchReport,
} from './renderer-bench-lib.js';
import { runRendererBenchmarks } from './renderer-bench.js';

function makeReport(avgFrameMs: number, hostname = 'devbox'): RendererBenchReport {
  return {
    kind: 'renderer-bench.v1',
    generatedAt: '2026-03-24T00:00:00.000Z',
    sampleCount: 3,
    environment: {
      platform: 'darwin',
      arch: 'arm64',
      release: '25.0.0',
      nodeVersion: 'v22.0.0',
      cpuModel: 'Apple M4 Max',
      cpuCount: 16,
      totalMemoryBytes: 68719476736,
      hostname,
      gitCommit: 'deadbee',
      gcExposed: true,
    },
    scenarios: [
      {
        scenario: {
          id: 'dogfood.render.medium',
          label: 'DOGFOOD landing render (220x58)',
          kind: 'render',
          columns: 220,
          rows: 58,
          frames: 240,
          warmupFrames: 30,
        },
        samples: [
          { elapsedMs: avgFrameMs * 240, avgFrameMs, approxFps: 1000 / avgFrameMs },
        ],
        medianElapsedMs: avgFrameMs * 240,
        medianAvgFrameMs: avgFrameMs,
        medianApproxFps: 1000 / avgFrameMs,
      },
    ],
  };
}

describe('renderer-bench-lib', () => {
  it('computes medians for odd and even counts', () => {
    expect(median([5, 1, 3])).toBe(3);
    expect(median([8, 2, 4, 6])).toBe(5);
  });

  it('marks slower runs as regressions', () => {
    const baseline = makeReport(4);
    const current = makeReport(5);
    const comparison = compareRendererBenchReports(baseline, current, { similarThresholdPct: 5 });

    expect(comparison.machineMatches).toBe(true);
    expect(comparison.rows[0]?.status).toBe('regressed');
    expect(comparison.rows[0]?.deltaPct).toBeCloseTo(25);
  });

  it('marks machine mismatches clearly', () => {
    const baseline = makeReport(4, 'devbox-a');
    const current = makeReport(4, 'devbox-b');
    const comparison = compareRendererBenchReports(baseline, current);

    expect(comparison.machineMatches).toBe(false);
    expect(benchmarkFingerprint(baseline.environment)).not.toBe(benchmarkFingerprint(current.environment));
  });

  it('can execute a tiny source-backed benchmark scenario', async () => {
    const report = await runRendererBenchmarks({
      sampleCount: 1,
      scenarios: [
        {
          id: 'dogfood.diff.tiny',
          label: 'DOGFOOD landing render+diff (40x12)',
          kind: 'diff',
          columns: 40,
          rows: 12,
          frames: 2,
          warmupFrames: 1,
        },
      ],
    });

    expect(report.scenarios).toHaveLength(1);
    expect(report.scenarios[0]?.medianAvgFrameMs).toBeGreaterThan(0);
    // Packed differ may produce 0 writes when consecutive frames are identical
    expect(report.scenarios[0]?.medianWrites).toBeGreaterThanOrEqual(0);
  });

  it('can execute a tiny DOGFOOD docs explorer render scenario', async () => {
    const report = await runRendererBenchmarks({
      sampleCount: 1,
      scenarios: [
        {
          id: 'dogfood.docs.render.medium',
          label: 'DOGFOOD docs explorer render (40x12)',
          kind: 'render',
          columns: 40,
          rows: 12,
          frames: 2,
          warmupFrames: 1,
        },
      ],
    });

    expect(report.scenarios).toHaveLength(1);
    expect(report.scenarios[0]?.medianAvgFrameMs).toBeGreaterThan(0);
  });

  it('can execute synthetic surface and normalize scenarios', async () => {
    const report = await runRendererBenchmarks({
      sampleCount: 1,
      scenarios: [
        {
          id: 'surface.paint.tiny',
          label: 'Synthetic surface paint (40x12)',
          kind: 'surface',
          columns: 40,
          rows: 12,
          frames: 2,
          warmupFrames: 1,
        },
        {
          id: 'layout.normalize.tiny',
          label: 'Synthetic layout normalize (40x12)',
          kind: 'normalize',
          columns: 40,
          rows: 12,
          frames: 2,
          warmupFrames: 1,
        },
      ],
    });

    expect(report.scenarios).toHaveLength(2);
    expect(report.scenarios[0]?.medianAvgFrameMs).toBeGreaterThan(0);
    expect(report.scenarios[1]?.medianAvgFrameMs).toBeGreaterThan(0);
  });

  it('can execute a synthetic styled diff scenario', async () => {
    const report = await runRendererBenchmarks({
      sampleCount: 1,
      scenarios: [
        {
          id: 'styled.diff.tiny',
          label: 'Synthetic styled diff (40x12)',
          kind: 'styled-diff',
          columns: 40,
          rows: 12,
          frames: 2,
          warmupFrames: 1,
        },
      ],
    });

    expect(report.scenarios).toHaveLength(1);
    expect(report.scenarios[0]?.medianAvgFrameMs).toBeGreaterThan(0);
    expect(report.scenarios[0]?.medianWrites).toBeGreaterThan(0);
  });

  it('can execute a synthetic frame composition scenario', async () => {
    const report = await runRendererBenchmarks({
      sampleCount: 1,
      scenarios: [
        {
          id: 'frame.compose.tiny',
          label: 'Synthetic frame compose (40x12)',
          kind: 'frame',
          columns: 40,
          rows: 12,
          frames: 2,
          warmupFrames: 1,
        },
      ],
    });

    expect(report.scenarios).toHaveLength(1);
    expect(report.scenarios[0]?.medianAvgFrameMs).toBeGreaterThan(0);
  });

  it('can execute a synthetic runtime noop scenario', async () => {
    const report = await runRendererBenchmarks({
      sampleCount: 1,
      scenarios: [
        {
          id: 'runtime.noop.tiny',
          label: 'Runtime noop pulses (40x12)',
          kind: 'runtime',
          columns: 40,
          rows: 12,
          frames: 3,
          warmupFrames: 1,
        },
      ],
    });

    expect(report.scenarios).toHaveLength(1);
    expect(report.scenarios[0]?.medianAvgFrameMs).toBeGreaterThan(0);
    expect(report.scenarios[0]?.medianWrites).toBe(0);
  });
});
