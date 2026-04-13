/**
 * Wall-time harness — parent/runner.
 *
 * Spawns child processes (one per (scenario, sample)) and collects
 * their JSON output into a structured report. Each child is fully
 * isolated so per-sample variance reflects only hardware/OS jitter,
 * not V8 state accumulation.
 */

import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import os from 'node:os';
import { computeStats, type SampleStats } from '../../stats.js';
import { SCENARIOS, getScenario } from '../../scenarios/index.js';
import type { AnyScenario } from '../../scenarios/index.js';

// Resolve the path to child.ts relative to this file so the runner
// can be invoked from anywhere.
const __dirname = dirname(fileURLToPath(import.meta.url));
const CHILD_PATH = resolve(__dirname, 'child.ts');

export interface ChildSample {
  readonly scenarioId: string;
  readonly sampleIndex: number;
  readonly elapsedNs: number;
  readonly frames: number;
  readonly nsPerFrame: number;
}

export interface ScenarioReport {
  readonly scenarioId: string;
  readonly label: string;
  readonly tags: readonly string[];
  readonly columns: number;
  readonly rows: number;
  readonly warmupFrames: number;
  readonly measureFrames: number;
  readonly samples: readonly ChildSample[];
  readonly nsPerFrameStats: SampleStats;
}

export interface RunReport {
  readonly kind: 'bench.v2';
  readonly runId: string;
  readonly generatedAt: string;
  readonly commit: string | null;
  readonly fingerprint: Fingerprint;
  readonly params: {
    readonly samples: number;
    readonly warmupFrames: number | 'scenario-default';
    readonly measureFrames: number | 'scenario-default';
  };
  readonly scenarios: readonly ScenarioReport[];
}

export interface Fingerprint {
  readonly platform: NodeJS.Platform;
  readonly arch: string;
  readonly release: string;
  readonly nodeVersion: string;
  readonly cpuModel: string;
  readonly cpuCount: number;
  readonly totalMemoryBytes: number;
  readonly hostname: string;
}

export interface RunOptions {
  readonly samples: number;
  readonly scenarioIds?: readonly string[];
  readonly warmupFramesOverride?: number;
  readonly measureFramesOverride?: number;
  readonly onProgress?: (event: ProgressEvent) => void;
}

export type ProgressEvent =
  | { readonly kind: 'scenario-start'; readonly scenario: AnyScenario; readonly total: number }
  | { readonly kind: 'sample-done'; readonly scenarioId: string; readonly sampleIndex: number; readonly nsPerFrame: number }
  | { readonly kind: 'scenario-done'; readonly scenarioId: string; readonly stats: SampleStats };

function detectFingerprint(): Fingerprint {
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
  };
}

function detectCommit(): string | null {
  const result = spawnSync('git', ['rev-parse', '--short', 'HEAD'], {
    encoding: 'utf8',
  });
  if (result.status !== 0) return null;
  return result.stdout.trim() || null;
}

function runChild(
  scenarioId: string,
  sampleIndex: number,
  warmupFrames: number,
  measureFrames: number,
): ChildSample {
  const result = spawnSync(
    process.execPath,
    [
      '--import',
      'tsx',
      CHILD_PATH,
      `--scenario=${scenarioId}`,
      `--sample=${sampleIndex}`,
      `--warmup=${warmupFrames}`,
      `--frames=${measureFrames}`,
    ],
    {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  if (result.status !== 0) {
    const stderr = result.stderr ?? '';
    throw new Error(`child failed for ${scenarioId} sample ${sampleIndex}: ${stderr}`);
  }
  const stdout = result.stdout ?? '';
  const line = stdout.trim();
  if (!line) {
    throw new Error(`child produced no output for ${scenarioId} sample ${sampleIndex}`);
  }
  try {
    return JSON.parse(line) as ChildSample;
  } catch (err) {
    throw new Error(`failed to parse child output for ${scenarioId} sample ${sampleIndex}: ${(err as Error).message}\nraw: ${line}`);
  }
}

export function runBench(options: RunOptions): RunReport {
  const scenarios: readonly AnyScenario[] = options.scenarioIds
    ? options.scenarioIds.map(getScenario)
    : SCENARIOS;

  const fingerprint = detectFingerprint();
  const commit = detectCommit();

  const scenarioReports: ScenarioReport[] = [];

  for (const scenario of scenarios) {
    const warmupFrames = options.warmupFramesOverride ?? scenario.defaultWarmupFrames;
    const measureFrames = options.measureFramesOverride ?? scenario.defaultMeasureFrames;

    options.onProgress?.({ kind: 'scenario-start', scenario, total: options.samples });

    const samples: ChildSample[] = [];
    for (let i = 0; i < options.samples; i++) {
      const sample = runChild(scenario.id, i, warmupFrames, measureFrames);
      samples.push(sample);
      options.onProgress?.({
        kind: 'sample-done',
        scenarioId: scenario.id,
        sampleIndex: i,
        nsPerFrame: sample.nsPerFrame,
      });
    }

    const nsPerFrameStats = computeStats(samples.map((s) => s.nsPerFrame));
    const report: ScenarioReport = {
      scenarioId: scenario.id,
      label: scenario.label,
      tags: scenario.tags,
      columns: scenario.columns,
      rows: scenario.rows,
      warmupFrames,
      measureFrames,
      samples,
      nsPerFrameStats,
    };
    scenarioReports.push(report);
    options.onProgress?.({ kind: 'scenario-done', scenarioId: scenario.id, stats: nsPerFrameStats });
  }

  return {
    kind: 'bench.v2',
    runId: randomUUID(),
    generatedAt: new Date().toISOString(),
    commit,
    fingerprint,
    params: {
      samples: options.samples,
      warmupFrames: options.warmupFramesOverride ?? 'scenario-default',
      measureFrames: options.measureFramesOverride ?? 'scenario-default',
    },
    scenarios: scenarioReports,
  };
}
