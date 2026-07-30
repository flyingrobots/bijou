import type {
  HarnessState,
  TestHarness,
} from './driver-contract.js';
import {
  latestSnapshot,
  processHarnessStep,
  settleHarness,
  teardownHarness,
} from './driver-harness-state.js';
import { isStopped } from './driver-runtime.js';

/** Bind mutable harness state behind the public read-only test API. */
export function createHarnessApi<Model, M>(
  state: HarnessState<Model, M>,
): TestHarness<Model, M> {
  return {
    get model() { return state.model; },
    get frame() { return latestSnapshot(state).frame; },
    get frames() { return state.frames; },
    get snapshots() { return state.snapshots; },
    get messages() { return state.messages; },
    get emittedMessages() { return state.emittedMessages; },
    get commands() { return state.commands; },
    get elapsed() { return state.clock.now() - state.start; },
    get running() { return !isStopped(state.runtime); },
    snapshot: () => latestSnapshot(state),
    settle: () => settleHarness(state),
    step: (step) => processHarnessStep(state, step),
    async run(steps) {
      for (const step of steps) {
        if (isStopped(state.runtime)) break;
        await processHarnessStep(state, step);
      }
      return settleHarness(state);
    },
    press: (key, delay = 0) =>
      processHarnessStep(state, { key, delay }),
    resize: (columns, rows, delay = 0) =>
      processHarnessStep(state, { resize: { columns, rows }, delay }),
    pulse: (dt, delay = 0) =>
      processHarnessStep(state, { pulse: { dt }, delay }),
    mouse: (mouse, delay = 0) =>
      processHarnessStep(state, { mouse, delay }),
    emit: (msg, delay = 0) =>
      processHarnessStep(state, { msg, delay }),
    teardown: () => teardownHarness(state),
  };
}
