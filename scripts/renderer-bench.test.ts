import { describe, expect, it } from 'vitest';
import {
  benchmarkFingerprint,
  compareRendererBenchReports,
  median,
  type RendererBenchReport,
} from './renderer-bench-lib.js';

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
});
