/**
 * Scripted driver for TEA applications.
 *
 * Feeds a sequence of key events into an app and captures all rendered
 * frames. Useful for automated demos, integration tests, and CI.
 *
 * ```ts
 * const result = await runScript(counterApp, [
 *   { key: 'up' },
 *   { key: 'up' },
 *   { key: 'down' },
 *   { key: 'q' },
 * ]);
 * console.log(result.model);   // final model state
 * console.log(result.frames);  // all rendered frames
 * ```
 */

import type { App, RunOptions, ResizeMsg, MouseMsg } from './types.js';
import { isResizeMsg } from './types.js';
import { createEventBus } from './eventbus.js';
import { parseKey } from './keys.js';
import { type Surface, resolveClock, sleep } from '@flyingrobots/bijou';
import { installBCSSResolver } from './css/install.js';
import { normalizeViewOutput } from './view-output.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single step in a scripted interaction sequence. */
export type ScriptStep<M = never> =
  | {
    /** Key to send (raw terminal key string, e.g., 'a', '\x1b[A', '\x03'). */
    key: string;
    /** Milliseconds to wait before sending this step. Default: 0. */
    delay?: number;
  }
  | {
    /** Resize event to emit. */
    resize: { columns: number; rows: number };
    /** Milliseconds to wait before sending this step. Default: 0. */
    delay?: number;
  }
  | {
    /** Pulse event to emit. */
    pulse: { dt: number };
    /** Milliseconds to wait before sending this step. Default: 0. */
    delay?: number;
  }
  | {
    /** Mouse event to emit. */
    mouse: MouseMsg;
    /** Milliseconds to wait before sending this step. Default: 0. */
    delay?: number;
  }
  | {
    /** Custom message to emit directly onto the bus. */
    msg: M;
    /** Milliseconds to wait before sending this step. Default: 0. */
    delay?: number;
  };

/** Options for {@link runScript}, extending the base {@link RunOptions}. */
export interface RunScriptOptions extends RunOptions {
  /** Capture each rendered frame. */
  onFrame?: (frame: Surface, index: number) => void;
  /** Pulse frequency used to drive animation commands. Set to `false` to disable. */
  pulseFps?: number | false;
}

/**
 * Result returned by {@link runScript} after all steps have been processed.
 *
 * @template Model - The application model type.
 */
export interface RunScriptResult<Model> {
  /** Final model state after all steps. */
  model: Model;
  /** All rendered frames in order. */
  frames: Surface[];
  /** Total elapsed time in milliseconds. */
  elapsed: number;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Run a TEA app with a scripted key sequence.
 *
 * Internally creates an EventBus and feeds parsed keys from the script.
 * Captures all frames rendered via `view()`. Returns the final model
 * and all frames for assertion or GIF generation.
 *
 * The app quits when:
 * - A command returns QUIT
 * - All script steps are exhausted (auto-quits)
 *
 * Between steps the driver waits for the event bus to go idle, so command
 * chains settle deterministically without relying on microtask-only yields.
 *
 * @template Model - The application model type.
 * @template M     - The message (action) type for the TEA update cycle.
 * @param app     - The TEA application definition (init, update, view).
 * @param steps   - Ordered key events to feed into the app.
 * @param options - Optional callbacks and runtime configuration.
 * @returns The final model, all rendered frames, and elapsed time.
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
  const ctx = options?.ctx;
  if (ctx != null) {
    installBCSSResolver(ctx, options?.css);
  }

  const [initModel, initCmds] = app.init();
  let model = initModel;
  let running = true;
  let currentSize = {
    width: Math.max(0, Math.floor(ctx?.runtime.columns || 80)),
    height: Math.max(0, Math.floor(ctx?.runtime.rows || 24)),
  };

  // Start heartbeat for animations when enabled.
  if (options?.pulseFps !== false) {
    bus.startPulse(options?.pulseFps ?? ctx?.runtime.refreshRate ?? 60);
  }

  /** Stop the scripted driver event loop. */
  function shutdown(): void {
    running = false;
  }

  bus.onQuit(shutdown);

  bus.on((msg) => {
    if (!running) return;
    const [newModel, cmds] = app.update(msg, model);
    model = newModel;
    if (isResizeMsg(msg)) {
      currentSize = {
        width: Math.max(0, msg.columns),
        height: Math.max(0, msg.rows),
      };
    }

    const frame = normalizeViewOutput(app.view(model), currentSize).surface;

    frames.push(frame);
    options?.onFrame?.(frame, frames.length - 1);
    for (const cmd of cmds) {
      bus.runCmd(cmd);
    }
  });

  try {
    // Capture initial frame
    const initFrame = normalizeViewOutput(app.view(model), currentSize).surface;

    frames.push(initFrame);
    options?.onFrame?.(initFrame, 0);

    // Run init commands
    for (const cmd of initCmds) {
      bus.runCmd(cmd);
    }

    await bus.drain();

    // Feed script steps
    for (const step of steps) {
      if (!running) break;

      if (step.delay && step.delay > 0) {
        await sleep(clock, step.delay);
      }

      if (!running) break;

      if ('key' in step) {
        const keyMsg = parseKey(step.key);
        bus.emit(keyMsg);
      } else if ('pulse' in step) {
        bus.emit({ type: 'pulse', dt: step.pulse.dt });
      } else if ('resize' in step) {
        const resizeMsg: ResizeMsg = {
          type: 'resize',
          columns: step.resize.columns,
          rows: step.resize.rows,
        };
        bus.emit(resizeMsg);
      } else if ('mouse' in step) {
        bus.emit(step.mouse as unknown as M);
      } else if ('msg' in step) {
        bus.emit(step.msg);
      } else {
        const _exhaustive: never = step;
        throw new Error(`runScript: unhandled script step variant: ${JSON.stringify(_exhaustive)}`);
      }

      await bus.drain();
    }

    await bus.drain();
  } finally {
    bus.stopPulse();
    bus.dispose();
  }

  return {
    model,
    frames,
    elapsed: clock.now() - start,
  };
}
