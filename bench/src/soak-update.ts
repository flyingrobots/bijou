import { quit, type Cmd, type FramePageMsg } from '@flyingrobots/bijou-tui';
import { latestPaneSize, type SoakModel, type SoakMsg } from './soak-model.js';
import { displayScenarios, MAX_CYCLES, DWELL_SECS, FRAME_INTERVAL_MS } from './soak-config.js';
import { currentScenario, initScenario, reinitAtSize, logAndAdvanceCmd } from './soak-scenarios.js';

export function updateSoak(msg: FramePageMsg<SoakMsg>, model: SoakModel): [SoakModel, Cmd<SoakMsg>[]] {
  if (msg.type === 'toggle-perf') {
    return [{ ...model, showPerf: !model.showPerf }, []];
  }

  if (msg.type === 'advance-scenario') {
    const w = latestPaneSize.width || model.paneWidth;
    const h = latestPaneSize.height || model.paneHeight;
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
    const pw = latestPaneSize.width || model.paneWidth;
    const ph = latestPaneSize.height || model.paneHeight;
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
}
