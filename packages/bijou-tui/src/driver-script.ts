import {
  resolveClock,
  type Surface,
} from '@flyingrobots/bijou';
import { installBCSSResolver } from './css/install.js';
import { createEventBus } from './eventbus.js';
import { isResizeMsg } from './types.js';
import type { App } from './types.js';
import type {
  RunScriptOptions,
  RunScriptResult,
  ScriptStep,
} from './driver-contract.js';
import {
  createDriverRuntimeState,
  dispatchScriptStep,
  initialSize,
  isStopped,
  normalizeFrame,
} from './driver-runtime.js';

/**
 * Run a TEA application against a deterministic scripted input sequence.
 *
 * @param app - Application to drive.
 * @param steps - Ordered interactions to feed into the application.
 * @param options - Optional callbacks and runtime configuration.
 * @returns The final model, rendered frames, and elapsed time.
 */
export async function runScript<Model, M>(
  app: App<Model, M>,
  steps: ScriptStep<M>[],
  options?: RunScriptOptions,
): Promise<RunScriptResult<Model>> {
  const clock = resolveClock(options?.ctx);
  const start = clock.now();
  const frames: Surface[] = [];
  const bus = createEventBus<M>({ clock });
  const state = createDriverRuntimeState();
  let currentSize = initialSize(options?.ctx);
  if (options?.ctx != null) {
    installBCSSResolver(options.ctx, options.css);
  }
  const [initialModel, initialCommands] = app.init();
  let model = initialModel;
  if (options?.pulseFps !== false) {
    bus.startPulse(
      options?.pulseFps ?? options?.ctx?.runtime.refreshRate ?? 60,
    );
  }
  bus.onQuit(() => {
    state.running = false;
  });
  bus.on((msg) => {
    if (!state.running) return;
    const [nextModel, commands] = app.update(msg, model);
    model = nextModel;
    if (isResizeMsg(msg)) {
      currentSize = {
        width: Math.max(0, msg.columns),
        height: Math.max(0, msg.rows),
      };
    }
    const frame = normalizeFrame(app, model, currentSize);
    frames.push(frame);
    options?.onFrame?.(frame, frames.length - 1);
    for (const command of commands) bus.runCmd(command);
  });
  try {
    const initialFrame = normalizeFrame(app, model, currentSize);
    frames.push(initialFrame);
    options?.onFrame?.(initialFrame, 0);
    for (const command of initialCommands) bus.runCmd(command);
    await bus.drain();
    for (const step of steps) {
      if (isStopped(state)) break;
      if (!await dispatchScriptStep(bus, clock, state, step)) break;
      await bus.drain();
    }
    await bus.drain();
    return { model, frames, elapsed: clock.now() - start };
  } finally {
    bus.stopPulse();
    bus.dispose();
  }
}
