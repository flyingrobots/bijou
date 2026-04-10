/**
 * Soak runner — HEADED visual demo of the rendering pipeline.
 *
 * Cycles through bench scenarios and RENDERS their output to the
 * actual terminal via the real byte-pipeline differ. You see the
 * gradient animating, cells flickering, the dogfood layout composing.
 * A status bar shows the current scenario, frame time, and cycle.
 *
 * Scenarios run at the actual terminal dimensions — resize the window
 * and the scenario re-initializes at the new size.
 *
 * Built on createFramedApp — the frame shell handles alt-screen,
 * raw mode, resize, keyboard input, and quit confirmation.
 *
 * Usage:
 *   npm run soak                       # run until quit
 *   npm run soak -- --cycles=5         # stop after N cycles
 *   npm run soak -- --fps=30           # throttle frame rate
 *   npm run soak -- --dwell=3          # seconds per scenario
 */

import { appendFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createSurface, type BijouContext, type Surface } from '@flyingrobots/bijou';
import { initDefaultContext } from '@flyingrobots/bijou-node';
import {
  createFramedApp,
  quit,
  run,
  type Cmd,
  type FramePageMsg,
} from '@flyingrobots/bijou-tui';
import { SCENARIOS } from './scenarios/index.js';
import type { AnyScenario } from './scenarios/types.js';
import { computeStats, formatNs } from './stats.js';

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
function argNum(name: string, fallback: number): number {
  const match = argv.find((a) => a.startsWith(`--${name}=`));
  return match ? parseFloat(match.split('=')[1]!) : fallback;
}
function argStr(name: string, fallback: string): string {
  const match = argv.find((a) => a.startsWith(`--${name}=`));
  return match ? match.split('=')[1]! : fallback;
}

const MAX_CYCLES = argNum('cycles', Infinity);
const TARGET_FPS = argNum('fps', 30);
const DWELL_SECS = argNum('dwell', 4);
const LOG_PATH = resolve(argStr('out', 'bench/soak.jsonl'));

// Scenarios that have a display surface to show.
const displayScenarios = SCENARIOS.filter(
  (s): s is AnyScenario & { getDisplaySurface: NonNullable<AnyScenario['getDisplaySurface']> } =>
    s.getDisplaySurface !== undefined,
);

// Ensure log file exists.
if (!existsSync(LOG_PATH)) writeFileSync(LOG_PATH, '');

// ---------------------------------------------------------------------------
// Model & Messages
// ---------------------------------------------------------------------------

interface SoakModel {
  readonly scenarioIndex: number;
  readonly scenarioState: unknown;
  readonly frameIndex: number;
  readonly frameTimes: number[];
  readonly cycle: number;
  readonly elapsedMs: number;
  readonly lastFrameNs: number;
  readonly paneWidth: number;
  readonly paneHeight: number;
}

type SoakMsg = { readonly type: 'advance-scenario' };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;
const SCENARIO_LABEL_DIMENSION_SUFFIX = /\s*\(\d+[×x]\d+\)\s*$/;

function currentScenario(model: SoakModel): (typeof displayScenarios)[number] {
  return displayScenarios[model.scenarioIndex]!;
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
  if (surface && surface.width === width && surface.height === height) {
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

function initScenario(scenarioIndex: number, cycle: number, width: number, height: number): SoakModel {
  const scenario = displayScenarios[scenarioIndex]!;
  const state = scenario.setup(undefined, width, height);
  runWarmup(scenario, state);
  return {
    scenarioIndex,
    scenarioState: state,
    frameIndex: 0,
    frameTimes: [],
    cycle,
    elapsedMs: 0,
    lastFrameNs: 0,
    paneWidth: width,
    paneHeight: height,
  };
}

function reinitAtSize(model: SoakModel, width: number, height: number): SoakModel {
  currentScenario(model).teardown?.(model.scenarioState);
  const scenario = displayScenarios[model.scenarioIndex]!;
  const state = scenario.setup(undefined, width, height);
  runWarmup(scenario, state);
  return {
    ...model,
    scenarioState: state,
    frameIndex: 0,
    frameTimes: [],
    elapsedMs: 0,
    lastFrameNs: 0,
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

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

// The pane render callback tells us the actual terminal content area.
// We track the latest dimensions so the update loop can detect resizes.
let latestPaneWidth = 0;
let latestPaneHeight = 0;

function createSoakApp(_ctx: BijouContext) {
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
      update(msg: FramePageMsg<SoakMsg>, model: SoakModel): [SoakModel, Cmd<SoakMsg>[]] {
        if (msg.type === 'advance-scenario') {
          const w = latestPaneWidth || model.paneWidth;
          const h = latestPaneHeight || model.paneHeight;
          const nextIndex = model.scenarioIndex + 1;
          if (nextIndex >= displayScenarios.length) {
            const nextCycle = model.cycle + 1;
            if (nextCycle >= MAX_CYCLES) {
              return [model, [quit()]];
            }
            return [initScenario(0, nextCycle, w, h), []];
          }
          return [initScenario(nextIndex, model.cycle, w, h), []];
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
          const frameNs = (t1 - t0) * 1_000_000;

          // frameTimes is a mutable array shared across model snapshots —
          // this is intentional: allocating a new array per frame would
          // defeat the purpose of a memory-stability soak test.
          model.frameTimes.push(frameNs);

          return [{
            ...model,
            frameIndex: model.frameIndex + 1,
            elapsedMs: newElapsed,
            lastFrameNs: frameNs,
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
            return renderScenarioSurface(model, width, height);
          },
        };
      },
    }],
    helpLineSource({ model: frameModel }) {
      const pageModel = frameModel.pageModels[frameModel.activePageId];
      if (!pageModel) return '';
      const ft = formatNs(pageModel.lastFrameNs);
      const dims = `${pageModel.paneWidth}×${pageModel.paneHeight}`;
      const left = `${scenarioShortLabel(pageModel)}  ${dims}  frame ${pageModel.frameIndex}  ${ft}/frame`;
      const right = `cycle ${pageModel.cycle}  [${pageModel.scenarioIndex + 1}/${displayScenarios.length}]`;
      return `${left}  |  ${right}`;
    },
  });
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

const ctx = initDefaultContext();
await run(createSoakApp(ctx), { ctx });
