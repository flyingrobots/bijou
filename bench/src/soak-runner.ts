import { appendFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createSurface, perfOverlaySurface, type BijouContext, type Surface } from '@flyingrobots/bijou';
import { initDefaultContext } from '@flyingrobots/bijou-node';
import {
  createFramedApp,
  createKeyMap,
  quit,
  run,
  type Cmd,
  type FramePageMsg,
} from '@flyingrobots/bijou-tui';
import { SCENARIOS } from './scenarios/index.js';
import type { AnyScenario } from './scenarios/types.js';
import { computeStats, formatNs } from './stats.js';

const argv = process.argv.slice(2);
function argValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  const match = argv.find((a) => a.startsWith(prefix));
  return match?.slice(prefix.length);
}
function argNum(name: string, fallback: number): number {
  const raw = argValue(name);
  if (raw === undefined) return fallback;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}
function argStr(name: string, fallback: string): string {
  return argValue(name) ?? fallback;
}

const MAX_CYCLES = argNum('cycles', Infinity);
const TARGET_FPS = argNum('fps', 30);
const DWELL_SECS = argNum('dwell', 4);
const LOG_PATH = resolve(argStr('out', 'bench/soak.jsonl'));

const displayScenarios = SCENARIOS.filter(
  (s): s is AnyScenario & { getDisplaySurface: NonNullable<AnyScenario['getDisplaySurface']> } =>
    s.getDisplaySurface !== undefined,
);

if (displayScenarios.length === 0) {
  throw new Error('No display scenarios found — at least one scenario must define getDisplaySurface');
}

if (!existsSync(LOG_PATH)) writeFileSync(LOG_PATH, '');

interface SoakModel {
  readonly scenarioIndex: number;
  readonly scenarioState: unknown;
  readonly frameIndex: number;
  frameTimes: number[];
  readonly cycle: number;
  readonly elapsedMs: number;
  readonly paneWidth: number;
  readonly paneHeight: number;
  readonly showPerf: boolean;
}

type SoakMsg =
  | { readonly type: 'advance-scenario' }
  | { readonly type: 'toggle-perf' };

const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;
// Matches both ASCII 'x' and Unicode '×' (U+00D7) in dimension suffixes like "(220×58)".
const SCENARIO_LABEL_DIMENSION_SUFFIX = /\s*\(\d+[×x]\d+\)\s*$/;

function scenarioAt(index: number): (typeof displayScenarios)[number] {
  const scenario = displayScenarios[index];
  if (scenario === undefined) throw new Error(`Invalid scenario index ${String(index)}`);
  return scenario;
}

function currentScenario(model: SoakModel): (typeof displayScenarios)[number] {
  return scenarioAt(model.scenarioIndex);
}

function scenarioShortLabel(model: SoakModel): string {
  return currentScenario(model).label.replace(SCENARIO_LABEL_DIMENSION_SUFFIX, '');
}

function runWarmup(scenario: AnyScenario, state: unknown): void {
  for (let w = 0; w < scenario.defaultWarmupFrames; w++) {
    scenario.frame(state, w);
  }
}

function logScenarioStats(model: SoakModel): void {
  const scenario = currentScenario(model);
  const stats = computeStats(model.frameTimes);
  const mem = process.memoryUsage();
  const entry = {
    ts: new Date().toISOString(),
    cycle: model.cycle,
    scenario: scenario.id,
    frames: model.frameTimes.length,
    nsPerFrame: Math.round(stats.mean),
    p50: Math.round(stats.p50),
    p90: Math.round(stats.p90),
    p99: Math.round(stats.p99),
    covPct: Math.round(stats.cov * 1000) / 10,
    heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024 * 10) / 10,
    rssMB: Math.round(mem.rss / 1024 / 1024 * 10) / 10,
  };
  appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n');
}

function renderScenarioSurface(model: SoakModel, width: number, height: number): Surface {
  const scenario = currentScenario(model);
  const surface = scenario.getDisplaySurface(model.scenarioState);
  if (surface?.width === width && surface.height === height) {
    return surface;
  }
  // Scenario surface doesn't match pane — blit what we have into a
  // correctly-sized surface. This only happens transiently before
  // a resize re-init completes.
  const fallback = createSurface(width, height);
  if (surface) {
    fallback.blit(surface, 0, 0);
  }
  return fallback;
}

function initScenario(scenarioIndex: number, cycle: number, width: number, height: number, prev?: SoakModel): SoakModel {
  const scenario = scenarioAt(scenarioIndex);
  const state = scenario.setup(undefined, width, height);
  runWarmup(scenario, state);
  return {
    scenarioIndex,
    scenarioState: state,
    frameIndex: 0,
    frameTimes: [],
    cycle,
    elapsedMs: 0,
    paneWidth: width,
    paneHeight: height,
    showPerf: prev?.showPerf ?? true,
  };
}

function reinitAtSize(model: SoakModel, width: number, height: number): SoakModel {
  currentScenario(model).teardown?.(model.scenarioState);
  const scenario = currentScenario(model);
  const state = scenario.setup(undefined, width, height);
  runWarmup(scenario, state);
  return {
    ...model,
    scenarioState: state,
    frameIndex: 0,
    frameTimes: [],
    elapsedMs: 0,
    paneWidth: width,
    paneHeight: height,
  };
}

function logAndAdvanceCmd(model: SoakModel): Cmd<SoakMsg> {
  return () => {
    logScenarioStats(model);
    currentScenario(model).teardown?.(model.scenarioState);
    return { type: 'advance-scenario' } satisfies SoakMsg;
  };
}

// The pane render callback tells us the actual terminal content area.
// We track the latest dimensions so the update loop can detect resizes.
let latestPaneWidth = 0;
let latestPaneHeight = 0;

function createSoakApp(appCtx: BijouContext) {
  return createFramedApp<SoakModel, SoakMsg>({
    title: 'Soak Runner',
    pages: [{
      id: 'soak',
      title: 'Soak',
      init(): [SoakModel, Cmd<SoakMsg>[]] {
        // Use the latest known pane dimensions, or a reasonable default
        // until the first render tells us the real size.
        const w = latestPaneWidth || 80;
        const h = latestPaneHeight || 24;
        return [initScenario(0, 0, w, h), []];
      },
      keyMap: createKeyMap<SoakMsg>().bind('`', 'Toggle perf overlay', { type: 'toggle-perf' }),
      update(msg: FramePageMsg<SoakMsg>, model: SoakModel): [SoakModel, Cmd<SoakMsg>[]] {
        if (msg.type === 'toggle-perf') {
          return [{ ...model, showPerf: !model.showPerf }, []];
        }

        if (msg.type === 'advance-scenario') {
          const w = latestPaneWidth || model.paneWidth;
          const h = latestPaneHeight || model.paneHeight;
          const nextIndex = model.scenarioIndex + 1;
          if (nextIndex >= displayScenarios.length) {
            const nextCycle = model.cycle + 1;
            if (nextCycle >= MAX_CYCLES) {
              return [model, [quit()]];
            }
            return [initScenario(0, nextCycle, w, h, model), []];
          }
          return [initScenario(nextIndex, model.cycle, w, h, model), []];
        }

        if (msg.type === 'pulse') {
          const dtMs = msg.dt * 1000;
          const newElapsed = model.elapsedMs + dtMs;
          const dwellMs = DWELL_SECS * 1000;

          // Detect terminal resize — re-init scenario at new dimensions.
          const pw = latestPaneWidth || model.paneWidth;
          const ph = latestPaneHeight || model.paneHeight;
          if (pw !== model.paneWidth || ph !== model.paneHeight) {
            return [reinitAtSize(model, pw, ph), []];
          }

          // Check if dwell time expired.
          if (newElapsed >= dwellMs) {
            const updated: SoakModel = { ...model, elapsedMs: newElapsed };
            return [updated, [logAndAdvanceCmd(updated)]];
          }

          // Throttle: only advance a scenario frame at the target FPS rate.
          const prevFrameSlot = Math.floor(model.elapsedMs / FRAME_INTERVAL_MS);
          const nextFrameSlot = Math.floor(newElapsed / FRAME_INTERVAL_MS);

          if (nextFrameSlot <= prevFrameSlot) {
            return [{ ...model, elapsedMs: newElapsed }, []];
          }

          // Advance the scenario frame.
          const scenario = currentScenario(model);
          const startFrame = scenario.defaultWarmupFrames;
          const t0 = performance.now();
          scenario.frame(model.scenarioState, startFrame + model.frameIndex);
          const t1 = performance.now();
          // performance.now() has microsecond resolution; the multiplication
          // gives µs-precision values stored as nanoseconds for consistency
          // with the headless harness output format.
          const frameNs = (t1 - t0) * 1_000_000;

          // frameTimes is a mutable array shared across model snapshots —
          // this is intentional: allocating a new array per frame would
          // defeat the purpose of a memory-stability soak test.
          model.frameTimes.push(frameNs);

          return [{
            ...model,
            frameIndex: model.frameIndex + 1,
            elapsedMs: newElapsed,
          }, []];
        }

        // Mouse events: ignore.
        return [model, []];
      },
      layout(model: SoakModel) {
        return {
          kind: 'pane' as const,
          paneId: 'soak',
          render: (width: number, height: number) => {
            // Capture actual pane dimensions for the update loop.
            latestPaneWidth = width;
            latestPaneHeight = height;
            const scene = renderScenarioSurface(model, width, height);

            if (!model.showPerf) return scene;

            // Composite the perf overlay into the top-right corner.
            const recent = model.frameTimes;
            const windowSize = Math.min(20, recent.length);
            let avgNs = 0;
            if (windowSize > 0) {
              let sum = 0;
              for (const ns of recent.slice(recent.length - windowSize)) sum += ns;
              avgNs = sum / windowSize;
            }
            const mem = process.memoryUsage();
            const historyMs = recent.length > 1 ? recent.map((ns) => ns / 1_000_000) : [];
            const measuredFps = avgNs > 0 ? 1_000_000_000 / avgNs : 0;
            const perfPanel = perfOverlaySurface({
              fps: measuredFps,
              frameTimeMs: avgNs / 1_000_000,
              frameTimeHistory: historyMs,
              width,
              height,
              heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024 * 10) / 10,
              rssMB: Math.round(mem.rss / 1024 / 1024 * 10) / 10,
              extras: [
                { label: 'scenario', value: scenarioShortLabel(model) },
                { label: 'frame', value: String(model.frameIndex) },
                {
                  label: 'cycle',
                  value: `${String(model.cycle)} [${String(model.scenarioIndex + 1)}/${String(displayScenarios.length)}]`,
                },
              ],
            }, {
              title: 'Perf',
              width: Math.min(36, Math.floor(width * 0.4)),
              chartHeight: 5,
              ctx: appCtx,
            });
            // Composite onto a fresh surface to avoid mutating the
            // scenario-owned buffer (which would leave stale overlay
            // pixels after toggling perf off).
            const composite = createSurface(width, height);
            composite.blit(scene, 0, 0);
            composite.blit(perfPanel, width - perfPanel.width - 1, 1);
            return composite;
          },
        };
      },
    }],
    helpLineSource({ model: frameModel }) {
      const pageModel = frameModel.pageModels[frameModel.activePageId];
      if (!pageModel) return '';
      // Show rolling average over recent frames for a stable reading.
      const recent = pageModel.frameTimes;
      const windowSize = Math.min(20, recent.length);
      let avg = 0;
      if (windowSize > 0) {
        let sum = 0;
        for (let i = recent.length - windowSize; i < recent.length; i++) {
          sum += recent[i] ?? 0;
        }
        avg = sum / windowSize;
      }
      const ft = formatNs(avg);
      const dims = `${String(pageModel.paneWidth)}×${String(pageModel.paneHeight)}`;
      const left = `${scenarioShortLabel(pageModel)}  ${dims}  frame ${String(pageModel.frameIndex)}  ${ft}/frame`;
      const right = `cycle ${String(pageModel.cycle)}  [${String(pageModel.scenarioIndex + 1)}/${String(displayScenarios.length)}]`;
      return `${left}  |  ${right}  |  \` perf`;
    },
  });
}

const ctx = initDefaultContext();
await run(createSoakApp(ctx), { ctx });
