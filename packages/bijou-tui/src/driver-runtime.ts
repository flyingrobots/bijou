import {
  sleep,
  type ClockPort,
  type Surface,
} from '@flyingrobots/bijou';
import type { EventBus } from './eventbus.js';
import { parseKey } from './keys.js';
import type {
  App,
  ResizeMsg,
  RunOptions,
} from './types.js';
import { normalizeViewOutput } from './view-output.js';
import type {
  DriverRuntimeState,
  ScriptStep,
} from './driver-contract.js';

export function createDriverRuntimeState(): DriverRuntimeState {
  return { running: true, tornDown: false };
}

export function isStopped(state: DriverRuntimeState): boolean {
  return state.tornDown || !state.running;
}

export function initialSize(
  ctx: RunOptions['ctx'],
): { width: number; height: number } {
  return {
    width: Math.max(0, Math.floor(ctx?.runtime.columns ?? 80)),
    height: Math.max(0, Math.floor(ctx?.runtime.rows ?? 24)),
  };
}

export function normalizeFrame<Model, M>(
  app: App<Model, M>,
  model: Model,
  size: { width: number; height: number },
): Surface {
  return normalizeViewOutput(app.view(model), size).surface;
}

export async function dispatchScriptStep<M>(
  bus: EventBus<M>,
  clock: ClockPort,
  state: DriverRuntimeState,
  step: ScriptStep<M>,
): Promise<boolean> {
  if (isStopped(state)) return false;
  if (step.delay != null && step.delay > 0) {
    await sleep(clock, step.delay);
  }
  if (isStopped(state)) return false;
  if ('key' in step) {
    bus.emit(parseKey(step.key));
  } else if ('pulse' in step) {
    bus.emit({ type: 'pulse', dt: step.pulse.dt });
  } else if ('resize' in step) {
    const resize: ResizeMsg = {
      type: 'resize',
      columns: step.resize.columns,
      rows: step.resize.rows,
    };
    bus.emit(resize);
  } else if ('mouse' in step) {
    bus.emit(step.mouse);
  } else if ('msg' in step) {
    bus.emit(step.msg);
  } else {
    const exhaustive: never = step;
    throw new Error(
      `runScript: unhandled script step variant: ${JSON.stringify(exhaustive)}`,
    );
  }
  return true;
}
