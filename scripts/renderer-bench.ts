#!/usr/bin/env node

import { performance } from 'node:perf_hooks';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { normalizeViewOutput } from '../packages/bijou-tui/src/view-output.js';
import { renderSurfaceFrame } from '../packages/bijou-tui/src/screen.js';
import { createDocsApp } from '../examples/docs/app.js';
import {
  DEFAULT_RENDERER_BENCH_SCENARIOS,
  detectRendererBenchEnvironment,
  formatRendererBenchSummary,
  summarizeScenarioResult,
  type RendererBenchReport,
  type RendererBenchSample,
  type RendererBenchScenario,
} from './renderer-bench-lib.js';

interface RendererBenchCliOptions {
  readonly sampleCount: number;
  readonly outPath?: string;
  readonly json: boolean;
}

function parseArgs(argv: readonly string[]): RendererBenchCliOptions {
  let sampleCount = 5;
  let outPath: string | undefined;
  let json = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--samples') {
      sampleCount = Number.parseInt(argv[++i] ?? '', 10);
      continue;
    }
    if (arg === '--out') {
      outPath = argv[++i];
      continue;
    }
    if (arg === '--json') {
      json = true;
      continue;
    }
    throw new Error(`unknown argument: ${arg}`);
  }

  if (!Number.isFinite(sampleCount) || sampleCount <= 0) {
    throw new Error(`invalid --samples value: ${sampleCount}`);
  }

  return { sampleCount, outPath, json };
}

function gitCommit(): string | null {
  const result = spawnSync('git', ['rev-parse', '--short', 'HEAD'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  if (result.status !== 0) return null;
  return result.stdout.trim() || null;
}

function forceGcIfAvailable(): void {
  if (typeof global.gc === 'function') {
    global.gc();
  }
}

function runScenarioSample(scenario: RendererBenchScenario): RendererBenchSample {
  const ctx = createTestContext({
    mode: 'interactive',
    runtime: {
      columns: scenario.columns,
      rows: scenario.rows,
      refreshRate: 60,
    },
  });
  const app = createDocsApp(ctx);
  let [model] = app.init();
  [model] = app.update({ type: 'resize', columns: scenario.columns, rows: scenario.rows }, model);

  const size = { width: scenario.columns, height: scenario.rows };
  const pulse = { type: 'pulse', dt: 1 / 60 } as const;

  let currentSurface = normalizeViewOutput(app.view(model), size).surface;
  const sink = {
    writes: 0,
    bytesWritten: 0,
    write(text: string) {
      this.writes += 1;
      this.bytesWritten += text.length;
    },
  };

  for (let i = 0; i < scenario.warmupFrames; i++) {
    [model] = app.update(pulse, model);
    const target = normalizeViewOutput(app.view(model), size).surface;
    if (scenario.kind === 'diff') {
      renderSurfaceFrame(sink as any, currentSurface, target, ctx.style);
    }
    currentSurface = target;
  }

  forceGcIfAvailable();
  const before = process.memoryUsage();
  const start = performance.now();

  for (let i = 0; i < scenario.frames; i++) {
    [model] = app.update(pulse, model);
    const target = normalizeViewOutput(app.view(model), size).surface;
    if (scenario.kind === 'diff') {
      renderSurfaceFrame(sink as any, currentSurface, target, ctx.style);
    }
    currentSurface = target;
  }

  const elapsedMs = performance.now() - start;
  const mid = process.memoryUsage();
  forceGcIfAvailable();
  const after = process.memoryUsage();

  return {
    elapsedMs,
    avgFrameMs: elapsedMs / scenario.frames,
    approxFps: 1000 / (elapsedMs / scenario.frames),
    writes: scenario.kind === 'diff' ? sink.writes : undefined,
    bytesWritten: scenario.kind === 'diff' ? sink.bytesWritten : undefined,
    transientHeapDelta: typeof global.gc === 'function' ? (mid.heapUsed - before.heapUsed) : undefined,
    retainedHeapDelta: typeof global.gc === 'function' ? (after.heapUsed - before.heapUsed) : undefined,
  };
}

export function runRendererBenchmarks(options: {
  readonly sampleCount?: number;
  readonly scenarios?: readonly RendererBenchScenario[];
} = {}): RendererBenchReport {
  const scenarios = options.scenarios ?? DEFAULT_RENDERER_BENCH_SCENARIOS;
  const sampleCount = options.sampleCount ?? 5;

  const scenarioResults = scenarios.map((scenario) => {
    const samples: RendererBenchSample[] = [];
    for (let i = 0; i < sampleCount; i++) {
      samples.push(runScenarioSample(scenario));
    }
    return summarizeScenarioResult(scenario, samples);
  });

  return {
    kind: 'renderer-bench.v1',
    generatedAt: new Date().toISOString(),
    sampleCount,
    environment: detectRendererBenchEnvironment(gitCommit()),
    scenarios: scenarioResults,
  };
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const report = runRendererBenchmarks({ sampleCount: options.sampleCount });

  if (options.outPath != null) {
    const outPath = resolve(process.cwd(), options.outPath);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  }

  if (options.json) {
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
    return;
  }

  process.stdout.write(formatRendererBenchSummary(report) + '\n');
  if (options.outPath != null) {
    process.stdout.write(`saved: ${resolve(process.cwd(), options.outPath)}\n`);
  }
}

if (process.argv[1] != null && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
