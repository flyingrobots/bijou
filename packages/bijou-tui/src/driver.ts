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

import type { App, RunOptions } from './types.js';
import { createEventBus } from './eventbus.js';
import { parseKey } from './keys.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single step in a scripted key sequence. */
export interface ScriptStep {
  /** Key to send (raw terminal key string, e.g., 'a', '\x1b[A', '\x03'). */
  key: string;
  /** Milliseconds to wait before sending this key. Default: 0. */
  delay?: number;
}

/** Options for {@link runScript}, extending the base {@link RunOptions}. */
export interface RunScriptOptions extends RunOptions {
  /** Capture each rendered frame. */
  onFrame?: (frame: string, index: number) => void;
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
  frames: string[];
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
 * **Limitation:** Between steps the driver yields via `queueMicrotask`,
 * which only settles microtask-based async (e.g. `Promise.resolve()`).
 * Commands that use `setTimeout`, real I/O, or other macrotask-based async
 * may not have completed before the next key is dispatched. Use `delay`
 * on subsequent steps to allow time for macrotask-based commands.
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
  steps: ScriptStep[],
  options?: RunScriptOptions,
): Promise<RunScriptResult<Model>> {
  const start = Date.now();
  const frames: string[] = [];
  const bus = createEventBus<M>();

  const [initModel, initCmds] = app.init();
  let model = initModel;
  let running = true;

  function shutdown(): void {
    running = false;
  }

  bus.onQuit(shutdown);

  bus.on((msg) => {
    if (!running) return;
    const [newModel, cmds] = app.update(msg, model);
    model = newModel;
    const frame = app.view(model);
    frames.push(frame);
    options?.onFrame?.(frame, frames.length - 1);
    for (const cmd of cmds) {
      bus.runCmd(cmd);
    }
  });

  try {
    // Capture initial frame
    const initFrame = app.view(model);
    frames.push(initFrame);
    options?.onFrame?.(initFrame, 0);

    // Run init commands
    for (const cmd of initCmds) {
      bus.runCmd(cmd);
    }

    // Yield so microtask-based init commands can settle
    await new Promise<void>((r) => queueMicrotask(r));

    // Feed script steps
    for (const step of steps) {
      if (!running) break;

      if (step.delay && step.delay > 0) {
        await new Promise<void>((r) => setTimeout(r, step.delay));
      }

      if (!running) break;

      const keyMsg = parseKey(step.key);
      bus.emit(keyMsg);

      // Yield to allow async commands to settle
      await new Promise<void>((r) => queueMicrotask(r));
    }

    // Final yield so any trailing commands can settle
    await new Promise<void>((r) => queueMicrotask(r));
  } finally {
    bus.dispose();
  }

  return {
    model,
    frames,
    elapsed: Date.now() - start,
  };
}
