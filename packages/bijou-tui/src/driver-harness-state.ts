import type { BusMsg } from './eventbus.js';
import type {
  HarnessState,
  ScriptStep,
  TestRuntimeSnapshot,
} from './driver-contract.js';
import {
  dispatchScriptStep,
  isStopped,
  normalizeFrame,
} from './driver-runtime.js';

export function latestSnapshot<Model, M>(
  state: HarnessState<Model, M>,
): TestRuntimeSnapshot<Model, M> {
  const snapshot = state.snapshots.at(-1);
  if (snapshot === undefined) {
    throw new Error('testRuntime: no snapshots captured');
  }
  return snapshot;
}

export function captureSnapshot<Model, M>(
  state: HarnessState<Model, M>,
  cause: 'init' | 'update',
  message?: BusMsg<M>,
): TestRuntimeSnapshot<Model, M> {
  const frame = normalizeFrame(state.app, state.model, state.currentSize);
  state.frames.push(frame);
  state.options?.onFrame?.(frame, state.frames.length - 1);
  const snapshot: TestRuntimeSnapshot<Model, M> = {
    index: state.snapshots.length,
    cause,
    message,
    model: state.model,
    frame,
  };
  state.snapshots.push(snapshot);
  return snapshot;
}

export async function settleHarness<Model, M>(
  state: HarnessState<Model, M>,
): Promise<TestRuntimeSnapshot<Model, M>> {
  await state.bus.drain();
  return latestSnapshot(state);
}

export async function processHarnessStep<Model, M>(
  state: HarnessState<Model, M>,
  step: ScriptStep<M>,
): Promise<TestRuntimeSnapshot<Model, M>> {
  if (isStopped(state.runtime)) return latestSnapshot(state);
  await dispatchScriptStep(state.bus, state.clock, state.runtime, step);
  return settleHarness(state);
}

export async function teardownHarness<Model, M>(
  state: HarnessState<Model, M>,
): Promise<void> {
  if (state.runtime.tornDown) return;
  state.runtime.tornDown = true;
  state.runtime.running = false;
  state.bus.stopPulse();
  state.bus.dispose();
  await Promise.resolve();
}
