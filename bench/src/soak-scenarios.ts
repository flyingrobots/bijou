import { appendFileSync } from 'node:fs';
import { createSurface, type Surface } from '@flyingrobots/bijou';
import type { Cmd } from '@flyingrobots/bijou-tui';
import type { AnyScenario } from './scenarios/types.js';
import { computeStats } from './stats.js';
import { displayScenarios, LOG_PATH } from './soak-config.js';
import type { SoakModel, SoakMsg } from './soak-model.js';

// Matches both ASCII 'x' and Unicode '×' (U+00D7) in dimension suffixes like "(220×58)".
const SCENARIO_LABEL_DIMENSION_SUFFIX = /\s*\(\d+[×x]\d+\)\s*$/;

function scenarioAt(index: number): (typeof displayScenarios)[number] {
  const scenario = displayScenarios[index];
  if (scenario === undefined) throw new Error(`Invalid scenario index ${String(index)}`);
  return scenario;
}

export function currentScenario(model: SoakModel): (typeof displayScenarios)[number] {
  return scenarioAt(model.scenarioIndex);
}

export function scenarioShortLabel(model: SoakModel): string {
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

export function renderScenarioSurface(model: SoakModel, width: number, height: number): Surface {
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

export function initScenario(scenarioIndex: number, cycle: number, width: number, height: number, prev?: SoakModel): SoakModel {
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

export function reinitAtSize(model: SoakModel, width: number, height: number): SoakModel {
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

export function logAndAdvanceCmd(model: SoakModel): Cmd<SoakMsg> {
  return () => {
    logScenarioStats(model);
    currentScenario(model).teardown?.(model.scenarioState);
    return { type: 'advance-scenario' } satisfies SoakMsg;
  };
}
