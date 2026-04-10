/**
 * Soak runner — HEADED visual demo of the rendering pipeline.
 *
 * Cycles through bench scenarios and RENDERS their output to the
 * actual terminal via the real byte-pipeline differ. You see the
 * gradient animating, cells flickering, the dogfood layout composing.
 * A status bar shows the current scenario, frame time, and cycle.
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
  readonly warmedUp: boolean;
}

type SoakMsg = { readonly type: 'advance-scenario' };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;

function currentScenario(model: SoakModel): (typeof displayScenarios)[number] {
  return displayScenarios[model.scenarioIndex]!;
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

function tileScenarioSurface(model: SoakModel, width: number, height: number): Surface {
  const scenario = currentScenario(model);
  const sceneSurface = scenario.getDisplaySurface(model.scenarioState);
  const tiled = createSurface(width, height);
  if (sceneSurface) {
    const sw = sceneSurface.width;
    const sh = sceneSurface.height;
    for (let ty = 0; ty < height; ty += sh) {
      for (let tx = 0; tx < width; tx += sw) {
        tiled.blit(sceneSurface, tx, ty);
      }
    }
  }
  return tiled;
}

function initScenario(scenarioIndex: number, cycle: number): SoakModel {
  const scenario = displayScenarios[scenarioIndex]!;
  const state = scenario.setup();
  runWarmup(scenario, state);
  return {
    scenarioIndex,
    scenarioState: state,
    frameIndex: 0,
    frameTimes: [],
    cycle,
    elapsedMs: 0,
    lastFrameNs: 0,
    warmedUp: true,
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

function createSoakApp(_ctx: BijouContext) {
  return createFramedApp<SoakModel, SoakMsg>({
    title: 'Soak Runner',
    pages: [{
      id: 'soak',
      title: 'Soak',
      init(): [SoakModel, Cmd<SoakMsg>[]] {
        return [initScenario(0, 0), []];
      },
      update(msg: FramePageMsg<SoakMsg>, model: SoakModel): [SoakModel, Cmd<SoakMsg>[]] {
        if (msg.type === 'advance-scenario') {
          const nextIndex = model.scenarioIndex + 1;
          if (nextIndex >= displayScenarios.length) {
            const nextCycle = model.cycle + 1;
            if (nextCycle >= MAX_CYCLES) {
              return [model, [quit()]];
            }
            return [initScenario(0, nextCycle), []];
          }
          return [initScenario(nextIndex, model.cycle), []];
        }

        if (msg.type === 'pulse') {
          const dtMs = msg.dt * 1000;
          const newElapsed = model.elapsedMs + dtMs;
          const dwellMs = DWELL_SECS * 1000;

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
          render: (width: number, height: number) => tileScenarioSurface(model, width, height),
        };
      },
    }],
    helpLineSource({ model: frameModel }) {
      const pageModel = frameModel.pageModels[frameModel.activePageId];
      if (!pageModel) return '';
      const scenario = currentScenario(pageModel);
      const ft = formatNs(pageModel.lastFrameNs);
      const left = `${scenario.label}  frame ${pageModel.frameIndex}  ${ft}/frame`;
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
