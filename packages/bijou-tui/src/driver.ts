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

import type { App, Cmd, KeyMsg, RunOptions } from './types.js';
import { QUIT } from './types.js';
import { createEventBus } from './eventbus.js';
import { parseKey } from './keys.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScriptStep {
  /** Key to send (raw terminal key string, e.g., 'a', '\x1b[A', '\x03'). */
  key: string;
  /** Milliseconds to wait before sending this key. Default: 0. */
  delay?: number;
}

export interface RunScriptOptions extends RunOptions {
  /** Capture each rendered frame. */
  onFrame?: (frame: string, index: number) => void;
}

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
    const [newModel, cmds] = app.update(msg as KeyMsg | M, model);
    model = newModel;
    const frame = app.view(model);
    frames.push(frame);
    options?.onFrame?.(frame, frames.length - 1);
    for (const cmd of cmds) {
      bus.runCmd(cmd);
    }
  });

  // Capture initial frame
  const initFrame = app.view(model);
  frames.push(initFrame);
  options?.onFrame?.(initFrame, 0);

  // Run init commands
  for (const cmd of initCmds) {
    bus.runCmd(cmd);
  }

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

  bus.dispose();

  return {
    model,
    frames,
    elapsed: Date.now() - start,
  };
}
