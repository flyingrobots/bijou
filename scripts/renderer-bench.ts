#!/usr/bin/env node

import { performance } from 'node:perf_hooks';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTestContext, mockClock } from '../packages/bijou/src/adapters/test/index.js';
import { createSurface, setDefaultContext, type LayoutNode, type Surface } from '../packages/bijou/src/index.js';
import { renderDiff } from '../packages/bijou/src/core/render/differ.js';
import { normalizeViewOutput, normalizeViewOutputInto } from '../packages/bijou-tui/src/view-output.js';
import { createDocsApp } from '../examples/docs/app.js';
import type { FrameLayoutNode } from '../packages/bijou-tui/src/app-frame.js';
import { renderFrameNode } from '../packages/bijou-tui/src/app-frame-render.js';
import { createPanelVisibilityState } from '../packages/bijou-tui/src/panel-state.js';
import { createPanelDockState } from '../packages/bijou-tui/src/panel-dock.js';
import { run } from '../packages/bijou-tui/src/runtime.js';
import { quit } from '../packages/bijou-tui/src/commands.js';
import type { App } from '../packages/bijou-tui/src/types.js';
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

function keyMsg(key: string) {
  return {
    type: 'key' as const,
    key,
    ctrl: false,
    alt: false,
    shift: false,
  };
}

function buildPatternSurface(width: number, height: number): Surface {
  const surface = createSurface(width, height);
  const palette = ['#1b1d3a', '#33415c', '#4b5d8a', '#f1dac4', '#f2c572', '#f97068'];
  const rowStride = Math.max(1, Math.floor(height / 6));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = palette[Math.floor((x + y) / rowStride) % palette.length]!;
      const char = (x + y) % 5 === 0 ? '·' : (y % 3 === 0 ? '─' : ' ');
      surface.set(x, y, {
        char,
        fg: char === ' ' ? undefined : color,
        bg: y % 2 === 0 ? '#111320' : '#171a28',
        empty: false,
      });
    }
  }

  return surface;
}

function buildSyntheticLayout(columns: number, rows: number): LayoutNode {
  const railWidth = Math.max(18, Math.floor(columns * 0.18));
  const gap = 2;
  const centerWidth = Math.max(20, columns - railWidth * 2 - gap * 2);
  const contentHeight = Math.max(8, rows - 6);
  const docsBlock = buildPatternSurface(centerWidth, Math.max(6, contentHeight - 10));
  const demoBlock = buildPatternSurface(Math.max(12, centerWidth - 8), 7);

  return {
    type: 'BenchLayout',
    rect: { x: 3, y: 2, width: columns - 6, height: rows - 4 },
    children: [
      {
        type: 'FamilyRail',
        rect: { x: 3, y: 3, width: railWidth, height: contentHeight },
        children: [],
        surface: buildPatternSurface(railWidth, contentHeight),
      },
      {
        type: 'DocsCenter',
        rect: { x: 3 + railWidth + gap, y: 3, width: centerWidth, height: contentHeight },
        children: [
          {
            type: 'DocsText',
            rect: { x: 3 + railWidth + gap + 1, y: 4, width: docsBlock.width, height: docsBlock.height },
            children: [],
            surface: docsBlock,
          },
          {
            type: 'DocsDemo',
            rect: {
              x: 3 + railWidth + gap + 4,
              y: 4 + docsBlock.height + 2,
              width: demoBlock.width,
              height: demoBlock.height,
            },
            children: [],
            surface: demoBlock,
          },
        ],
      },
      {
        type: 'VariantRail',
        rect: { x: columns - railWidth - 3, y: 3, width: railWidth, height: contentHeight },
        children: [],
        surface: buildPatternSurface(railWidth, contentHeight),
      },
    ],
  };
}

function buildStyledDiffPair(columns: number, rows: number): { current: Surface; target: Surface } {
  const current = createSurface(columns, rows, { char: ' ', bg: '#10131f', empty: false });
  const target = createSurface(columns, rows, { char: ' ', bg: '#10131f', empty: false });
  const gradient = ['#9ba9ff', '#c8c7ea', '#f4c389', '#f67f65'];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      if ((x + y) % 7 === 0) {
        current.set(x, y, { char: '·', fg: '#2f3851', bg: '#10131f', empty: false });
      }

      if ((x + y) % 3 === 0) {
        target.set(x, y, {
          char: '█',
          fg: gradient[(x + y) % gradient.length]!,
          bg: y % 2 === 0 ? '#171b2c' : '#10131f',
          modifiers: x % 11 === 0 ? ['bold'] : undefined,
          empty: false,
        });
      } else if ((x + y) % 5 === 0) {
        target.set(x, y, {
          char: '·',
          fg: '#4d5f89',
          bg: '#10131f',
          empty: false,
        });
      }
    }
  }

  return { current, target };
}

function buildSyntheticFrameLayout(
  columns: number,
  rows: number,
): FrameLayoutNode {
  const paneCache = new Map<string, Surface>();
  const patternFor = (width: number, height: number, variant: number): Surface => {
    const key = `${width}x${height}:${variant}`;
    const cached = paneCache.get(key);
    if (cached != null) return cached;
    const surface = createSurface(width, height, {
      char: ' ',
      bg: variant === 0 ? '#111320' : variant === 1 ? '#151927' : '#181d2d',
      empty: false,
    });
    const palette = variant === 0
      ? ['#4d5f89', '#7084b1', '#d3d7ea']
      : variant === 1
        ? ['#f2c572', '#f4d7a8', '#f97068']
        : ['#6f8cc4', '#9ba9ff', '#c8c7ea'];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const stripe = Math.floor((x + y * 2) / Math.max(1, Math.floor(width / 9))) % palette.length;
        const char = (x + y) % 7 === 0 ? '·' : (y % 5 === 0 ? '─' : ' ');
        surface.set(x, y, {
          char,
          fg: char === ' ' ? undefined : palette[stripe],
          bg: variant === 0 ? '#111320' : variant === 1 ? '#151927' : '#181d2d',
          empty: false,
        });
      }
    }
    paneCache.set(key, surface);
    return surface;
  };

  const railWidth = Math.max(18, Math.floor(columns * 0.16));
  const demoMinHeight = Math.max(6, Math.floor(rows * 0.22));
  const ratio = Math.max(0.55, Math.min(0.78, 1 - demoMinHeight / Math.max(1, rows)));

  return {
    kind: 'grid',
    gridId: 'bench-shell',
    columns: [railWidth, '1fr', railWidth],
    rows: ['1fr'],
    areas: ['family main variants'],
    gap: 1,
    cells: {
      family: {
        kind: 'pane',
        paneId: 'family-nav',
        render: (width, height) => patternFor(width, height, 0),
      },
      main: {
        kind: 'split',
        splitId: 'main-stack',
        direction: 'column',
        state: { ratio, focused: 'a' },
        paneA: {
          kind: 'pane',
          paneId: 'docs-pane',
          render: (width, height) => patternFor(width, height, 1),
        },
        paneB: {
          kind: 'pane',
          paneId: 'demo-pane',
          render: (width, height) => patternFor(width, height, 2),
        },
      },
      variants: {
        kind: 'pane',
        paneId: 'variants-pane',
        render: (width, height) => patternFor(width, height, 0),
      },
    },
  };
}

function runSurfaceScenarioSample(scenario: RendererBenchScenario): RendererBenchSample {
  const target = createSurface(scenario.columns, scenario.rows);
  const source = buildPatternSurface(Math.max(24, Math.floor(scenario.columns / 3)), Math.max(8, Math.floor(scenario.rows / 3)));
  const header = Array.from({ length: scenario.columns }, (_, index) => ({
    char: index % 2 === 0 ? '═' : '─',
    fg: '#f2c572',
    bg: '#111320',
    empty: false,
  }));

  const paintFrame = () => {
    target.clear();
    target.fill({ char: ' ', bg: '#111320', empty: false });
    target.blit(source, 2, 2);
    target.blit(source, Math.max(0, scenario.columns - source.width - 2), Math.max(0, scenario.rows - source.height - 2));
    target.blit(source, Math.max(0, Math.floor((scenario.columns - source.width) / 2)), Math.max(0, Math.floor((scenario.rows - source.height) / 2)));
    target.setRow(0, header);
  };

  for (let i = 0; i < scenario.warmupFrames; i++) {
    paintFrame();
  }

  forceGcIfAvailable();
  const before = process.memoryUsage();
  const start = performance.now();

  for (let i = 0; i < scenario.frames; i++) {
    paintFrame();
  }

  const elapsedMs = performance.now() - start;
  const mid = process.memoryUsage();
  forceGcIfAvailable();
  const after = process.memoryUsage();

  return {
    elapsedMs,
    avgFrameMs: elapsedMs / scenario.frames,
    approxFps: 1000 / (elapsedMs / scenario.frames),
    transientHeapDelta: typeof global.gc === 'function' ? (mid.heapUsed - before.heapUsed) : undefined,
    retainedHeapDelta: typeof global.gc === 'function' ? (after.heapUsed - before.heapUsed) : undefined,
  };
}

function runNormalizeScenarioSample(scenario: RendererBenchScenario): RendererBenchSample {
  const layout = buildSyntheticLayout(scenario.columns, scenario.rows);
  const size = { width: scenario.columns, height: scenario.rows };
  let scratch = createSurface(size.width, size.height);

  for (let i = 0; i < scenario.warmupFrames; i++) {
    scratch = normalizeViewOutputInto(layout, size, scratch).surface;
  }

  forceGcIfAvailable();
  const before = process.memoryUsage();
  const start = performance.now();

  for (let i = 0; i < scenario.frames; i++) {
    scratch = normalizeViewOutputInto(layout, size, scratch).surface;
  }

  const elapsedMs = performance.now() - start;
  const mid = process.memoryUsage();
  forceGcIfAvailable();
  const after = process.memoryUsage();

  return {
    elapsedMs,
    avgFrameMs: elapsedMs / scenario.frames,
    approxFps: 1000 / (elapsedMs / scenario.frames),
    transientHeapDelta: typeof global.gc === 'function' ? (mid.heapUsed - before.heapUsed) : undefined,
    retainedHeapDelta: typeof global.gc === 'function' ? (after.heapUsed - before.heapUsed) : undefined,
  };
}

function runStyledDiffScenarioSample(scenario: RendererBenchScenario): RendererBenchSample {
  const ctx = createTestContext({
    mode: 'interactive',
    runtime: {
      columns: scenario.columns,
      rows: scenario.rows,
      refreshRate: 60,
    },
  });
  const { current, target } = buildStyledDiffPair(scenario.columns, scenario.rows);
  const sink = {
    writes: 0,
    bytesWritten: 0,
    write(text: string) {
      this.writes += 1;
      this.bytesWritten += text.length;
    },
    writeError() {},
  };

  for (let i = 0; i < scenario.warmupFrames; i++) {
    renderDiff(current, target, sink, ctx.style);
  }

  forceGcIfAvailable();
  const before = process.memoryUsage();
  const start = performance.now();

  for (let i = 0; i < scenario.frames; i++) {
    renderDiff(current, target, sink, ctx.style);
  }

  const elapsedMs = performance.now() - start;
  const mid = process.memoryUsage();
  forceGcIfAvailable();
  const after = process.memoryUsage();

  return {
    elapsedMs,
    avgFrameMs: elapsedMs / scenario.frames,
    approxFps: 1000 / (elapsedMs / scenario.frames),
    writes: sink.writes,
    bytesWritten: sink.bytesWritten,
    transientHeapDelta: typeof global.gc === 'function' ? (mid.heapUsed - before.heapUsed) : undefined,
    retainedHeapDelta: typeof global.gc === 'function' ? (after.heapUsed - before.heapUsed) : undefined,
  };
}

function runFrameScenarioSample(scenario: RendererBenchScenario): RendererBenchSample {
  const ctx = createTestContext({
    mode: 'interactive',
    runtime: {
      columns: scenario.columns,
      rows: scenario.rows,
      refreshRate: 60,
    },
  });
  setDefaultContext(ctx);
  const layoutTree = buildSyntheticFrameLayout(scenario.columns, scenario.rows);
  const bodyRect = {
    row: 0,
    col: 0,
    width: scenario.columns,
    height: scenario.rows,
  };
  const renderCtx = {
    model: {
      splitRatioOverrides: {},
    },
    pageId: 'bench',
    focusedPaneId: 'docs-pane',
    scrollByPane: {},
    visibility: createPanelVisibilityState(),
    dockState: createPanelDockState(),
  };

  for (let i = 0; i < scenario.warmupFrames; i++) {
    renderFrameNode(layoutTree, bodyRect, renderCtx as never);
  }

  forceGcIfAvailable();
  const before = process.memoryUsage();
  const start = performance.now();

  for (let i = 0; i < scenario.frames; i++) {
    renderFrameNode(layoutTree, bodyRect, renderCtx as never);
  }

  const elapsedMs = performance.now() - start;
  const mid = process.memoryUsage();
  forceGcIfAvailable();
  const after = process.memoryUsage();

  return {
    elapsedMs,
    avgFrameMs: elapsedMs / scenario.frames,
    approxFps: 1000 / (elapsedMs / scenario.frames),
    transientHeapDelta: typeof global.gc === 'function' ? (mid.heapUsed - before.heapUsed) : undefined,
    retainedHeapDelta: typeof global.gc === 'function' ? (after.heapUsed - before.heapUsed) : undefined,
  };
}

function countWrittenBytes(chunks: readonly string[]): number {
  return chunks.reduce((total, chunk) => total + chunk.length, 0);
}

async function runRuntimeScenarioSample(scenario: RendererBenchScenario): Promise<RendererBenchSample> {
  const clock = mockClock();
  const ctx = createTestContext({
    mode: 'interactive',
    clock,
    runtime: {
      columns: scenario.columns,
      rows: scenario.rows,
      refreshRate: 60,
    },
  });
  const pulseIntervalMs = Math.max(1, Math.round(1000 / ctx.runtime.refreshRate));
  const quitAtMs = pulseIntervalMs * (scenario.warmupFrames + scenario.frames + 2);
  const model = { value: 0 };
  let viewCalls = 0;

  const app: App<typeof model, never> = {
    init: () => [model, []],
    update(msg, current) {
      if (msg.type === 'key' && msg.key === 'q') {
        return [current, [quit()]];
      }
      return [current, []];
    },
    view(current) {
      viewCalls += 1;
      return createSurface(1, 1, current.value === 0
        ? { char: '·', fg: '#9ba9ff', bg: '#10131f', empty: false }
        : { char: 'x', fg: '#f67f65', bg: '#10131f', empty: false });
    },
  };

  ctx.io.rawInput = (onKey) => {
    const handle = clock.setTimeout(() => onKey('q'), quitAtMs);
    return {
      dispose() {
        handle.dispose();
      },
    };
  };

  const promise = run(app, { ctx });
  await clock.advanceByAsync(pulseIntervalMs * scenario.warmupFrames);

  forceGcIfAvailable();
  const baselineWrites = ctx.io.written.length;
  const baselineBytes = countWrittenBytes(ctx.io.written);
  const before = process.memoryUsage();
  const start = performance.now();

  await clock.advanceByAsync(pulseIntervalMs * scenario.frames);

  const elapsedMs = performance.now() - start;
  const mid = process.memoryUsage();
  forceGcIfAvailable();
  const after = process.memoryUsage();

  const measuredWrites = ctx.io.written.length - baselineWrites;
  const measuredBytes = countWrittenBytes(ctx.io.written) - baselineBytes;

  await clock.advanceByAsync(pulseIntervalMs * 3);
  await promise;

  if (viewCalls < 1) {
    throw new Error('runtime benchmark did not render an initial view');
  }

  return {
    elapsedMs,
    avgFrameMs: elapsedMs / scenario.frames,
    approxFps: 1000 / (elapsedMs / scenario.frames),
    writes: measuredWrites,
    bytesWritten: measuredBytes,
    transientHeapDelta: typeof global.gc === 'function' ? (mid.heapUsed - before.heapUsed) : undefined,
    retainedHeapDelta: typeof global.gc === 'function' ? (after.heapUsed - before.heapUsed) : undefined,
  };
}

async function runScenarioSample(scenario: RendererBenchScenario): Promise<RendererBenchSample> {
  if (scenario.kind === 'surface') {
    return runSurfaceScenarioSample(scenario);
  }

  if (scenario.kind === 'normalize') {
    return runNormalizeScenarioSample(scenario);
  }

  if (scenario.kind === 'styled-diff') {
    return runStyledDiffScenarioSample(scenario);
  }

  if (scenario.kind === 'frame') {
    return runFrameScenarioSample(scenario);
  }

  if (scenario.kind === 'runtime') {
    return runRuntimeScenarioSample(scenario);
  }

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

  if (scenario.id === 'dogfood.docs.render.medium') {
    [model] = app.update(keyMsg('enter'), model);
  }

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
    writeError() {},
  };

  for (let i = 0; i < scenario.warmupFrames; i++) {
    [model] = app.update(pulse, model);
    const target = normalizeViewOutput(app.view(model), size).surface;
    if (scenario.kind === 'diff') {
      renderDiff(currentSurface, target, sink, ctx.style);
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
      renderDiff(currentSurface, target, sink, ctx.style);
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

export async function runRendererBenchmarks(options: {
  readonly sampleCount?: number;
  readonly scenarios?: readonly RendererBenchScenario[];
} = {}): Promise<RendererBenchReport> {
  const scenarios = options.scenarios ?? DEFAULT_RENDERER_BENCH_SCENARIOS;
  const sampleCount = options.sampleCount ?? 5;

  const scenarioResults = await Promise.all(scenarios.map(async (scenario) => {
    const samples: RendererBenchSample[] = [];
    for (let i = 0; i < sampleCount; i++) {
      samples.push(await runScenarioSample(scenario));
    }
    return summarizeScenarioResult(scenario, samples);
  }));

  return {
    kind: 'renderer-bench.v1',
    generatedAt: new Date().toISOString(),
    sampleCount,
    environment: detectRendererBenchEnvironment(gitCommit()),
    scenarios: scenarioResults,
  };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const report = await runRendererBenchmarks({ sampleCount: options.sampleCount });

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
  void main();
}
