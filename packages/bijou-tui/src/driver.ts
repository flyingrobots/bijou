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

import type { App, RunOptions, ResizeMsg, MouseMsg, Cmd } from './types.js';
import { isCmdCleanup, isResizeMsg, QUIT } from './types.js';
import { createEventBus, type BusMsg } from './eventbus.js';
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

/** Options for {@link testRuntime}. */
export interface TestRuntimeOptions extends RunScriptOptions {}

/** Final outcome recorded for a command observed by {@link testRuntime}. */
export type TestRuntimeCommandResolution =
  | 'pending'
  | 'message'
  | 'quit'
  | 'cleanup'
  | 'void'
  | 'rejected';

/**
 * Recorded command behavior captured by a {@link TestHarness}.
 *
 * `emitted` contains messages pushed through the command's `emit()` callback,
 * while `result` records the command's final return value when it settles.
 */
export interface TestRuntimeCommandRecord<M> {
  /** Stable id assigned in runtime execution order. */
  readonly id: number;
  /** Whether the command originated from `init()` or an `update()` turn. */
  readonly source: 'init' | 'update';
  /** Index into {@link TestHarness.messages} for update-triggered commands. */
  readonly triggerIndex: number | null;
  /** Messages emitted incrementally through `emit(msg)`. */
  readonly emitted: readonly M[];
  /** How the command ultimately settled. */
  readonly resolution: TestRuntimeCommandResolution;
  /** Final returned value when the command settled with a value or error. */
  readonly result?: M | unknown;
  /** Whether runtime teardown disposed the command's cleanup handle. */
  readonly cleanedUp: boolean;
  /** Whether the command has finished executing. */
  readonly settled: boolean;
}

/**
 * Render/model checkpoint captured by a {@link TestHarness}.
 *
 * The initial snapshot is recorded after `init()` renders. Later snapshots are
 * recorded after each handled message.
 */
export interface TestRuntimeSnapshot<Model, M> {
  /** Zero-based snapshot index. */
  readonly index: number;
  /** Whether this frame came from initial render or an update turn. */
  readonly cause: 'init' | 'update';
  /** Message that triggered the update render, when applicable. */
  readonly message?: BusMsg<M>;
  /** Model value visible to the view at this snapshot. */
  readonly model: Model;
  /** Normalized rendered frame. */
  readonly frame: Surface;
}

/**
 * Interactive test harness for a TEA runtime.
 *
 * Provides direct assertions on snapshots, handled messages, command
 * resolution, and cleanup disposal without reaching into `EventBus` internals.
 */
export interface TestHarness<Model, M> {
  /** Latest model state. */
  readonly model: Model;
  /** Latest rendered frame. */
  readonly frame: Surface;
  /** All rendered frames in order, including the initial render. */
  readonly frames: readonly Surface[];
  /** Recorded render/model checkpoints. */
  readonly snapshots: readonly TestRuntimeSnapshot<Model, M>[];
  /** All handled runtime messages in delivery order. */
  readonly messages: readonly BusMsg<M>[];
  /** Custom messages emitted or returned by commands. */
  readonly emittedMessages: readonly M[];
  /** Recorded command lifecycle outcomes. */
  readonly commands: readonly TestRuntimeCommandRecord<M>[];
  /** Milliseconds elapsed on the active runtime clock. */
  readonly elapsed: number;
  /** Whether the harness is still accepting steps. */
  readonly running: boolean;
  /** Return the latest snapshot. */
  snapshot(): TestRuntimeSnapshot<Model, M>;
  /** Wait until in-flight commands settle. */
  settle(): Promise<TestRuntimeSnapshot<Model, M>>;
  /** Feed a single scripted step through the runtime. */
  step(step: ScriptStep<M>): Promise<TestRuntimeSnapshot<Model, M>>;
  /** Feed multiple scripted steps through the runtime. */
  run(steps: ScriptStep<M>[]): Promise<TestRuntimeSnapshot<Model, M>>;
  /** Emit a key step. */
  press(key: string, delay?: number): Promise<TestRuntimeSnapshot<Model, M>>;
  /** Emit a resize step. */
  resize(columns: number, rows: number, delay?: number): Promise<TestRuntimeSnapshot<Model, M>>;
  /** Emit a pulse step. */
  pulse(dt: number, delay?: number): Promise<TestRuntimeSnapshot<Model, M>>;
  /** Emit a mouse step. */
  mouse(message: MouseMsg, delay?: number): Promise<TestRuntimeSnapshot<Model, M>>;
  /** Emit a custom application message directly. */
  emit(msg: M, delay?: number): Promise<TestRuntimeSnapshot<Model, M>>;
  /** Stop the runtime and dispose retained command cleanups. */
  teardown(): Promise<void>;
}

interface MutableCommandRecord<M> extends TestRuntimeCommandRecord<M> {
  emitted: M[];
  resolution: TestRuntimeCommandResolution;
  result?: M | unknown;
  cleanedUp: boolean;
  settled: boolean;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

function initialSize(ctx: RunOptions['ctx']): { width: number; height: number } {
  return {
    width: Math.max(0, Math.floor(ctx?.runtime.columns || 80)),
    height: Math.max(0, Math.floor(ctx?.runtime.rows || 24)),
  };
}

function normalizeFrame<Model, M>(
  app: App<Model, M>,
  model: Model,
  size: { width: number; height: number },
): Surface {
  return normalizeViewOutput(app.view(model), size).surface;
}

/**
 * Start a TEA app inside an inspectable test harness.
 *
 * The harness renders the initial frame, settles init commands, and then lets
 * callers feed steps one at a time while asserting against snapshots, handled
 * messages, command outcomes, and cleanup disposal.
 */
export async function testRuntime<Model, M>(
  app: App<Model, M>,
  options?: TestRuntimeOptions,
): Promise<TestHarness<Model, M>> {
  const clock = resolveClock(options?.ctx);
  const start = clock.now();
  const frames: Surface[] = [];
  const snapshots: TestRuntimeSnapshot<Model, M>[] = [];
  const handledMessages: Array<BusMsg<M>> = [];
  const emittedMessages: M[] = [];
  const commandRecords: MutableCommandRecord<M>[] = [];
  const bus = createEventBus<M>({ clock });
  const ctx = options?.ctx;
  let commandId = 0;
  let running = true;
  let tornDown = false;
  let model!: Model;
  let currentSize = initialSize(ctx);

  if (ctx != null) {
    installBCSSResolver(ctx, options?.css);
  }

  if (options?.pulseFps !== false) {
    bus.startPulse(options?.pulseFps ?? ctx?.runtime.refreshRate ?? 60);
  }

  function latestSnapshot(): TestRuntimeSnapshot<Model, M> {
    return snapshots[snapshots.length - 1]!;
  }

  function captureSnapshot(
    cause: 'init' | 'update',
    message?: BusMsg<M>,
  ): TestRuntimeSnapshot<Model, M> {
    const frame = normalizeFrame(app, model, currentSize);
    frames.push(frame);
    options?.onFrame?.(frame, frames.length - 1);
    const snapshot: TestRuntimeSnapshot<Model, M> = {
      index: snapshots.length,
      cause,
      message,
      model,
      frame,
    };
    snapshots.push(snapshot);
    return snapshot;
  }

  function wrapCommand(
    cmd: Cmd<M>,
    source: 'init' | 'update',
    triggerIndex: number | null,
  ): Cmd<M> {
    const record: MutableCommandRecord<M> = {
      id: commandId++,
      source,
      triggerIndex,
      emitted: [],
      resolution: 'pending',
      cleanedUp: false,
      settled: false,
    };
    commandRecords.push(record);

    return async (emit, caps) => {
      const trackedEmit = (msg: M) => {
        record.emitted.push(msg);
        emittedMessages.push(msg);
        emit(msg);
      };

      try {
        const result = await cmd(trackedEmit, caps);
        record.settled = true;

        if (isCmdCleanup(result)) {
          record.resolution = 'cleanup';
          record.result = result;
          if (typeof result === 'function') {
            return () => {
              record.cleanedUp = true;
              result();
            };
          }
          return {
            dispose() {
              record.cleanedUp = true;
              result.dispose();
            },
          };
        }

        if (result === QUIT) {
          record.resolution = 'quit';
          return result;
        }

        if (result !== undefined) {
          record.resolution = 'message';
          record.result = result;
          emittedMessages.push(result as M);
          return result;
        }

        record.resolution = 'void';
        return undefined;
      } catch (error) {
        record.settled = true;
        record.resolution = 'rejected';
        record.result = error;
        throw error;
      }
    };
  }

  async function settle(): Promise<TestRuntimeSnapshot<Model, M>> {
    await bus.drain();
    return latestSnapshot();
  }

  async function processStep(step: ScriptStep<M>): Promise<TestRuntimeSnapshot<Model, M>> {
    if (tornDown || !running) return latestSnapshot();

    if (step.delay && step.delay > 0) {
      await sleep(clock, step.delay);
    }

    if (tornDown || !running) return latestSnapshot();

    if ('key' in step) {
      bus.emit(parseKey(step.key));
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

    return settle();
  }

  async function teardown(): Promise<void> {
    if (tornDown) return;
    tornDown = true;
    running = false;
    bus.stopPulse();
    bus.dispose();
    await Promise.resolve();
  }

  bus.onQuit(() => {
    running = false;
  });

  bus.on((msg) => {
    if (!running) return;
    handledMessages.push(msg);
    const [nextModel, cmds] = app.update(msg, model);
    model = nextModel;
    if (isResizeMsg(msg)) {
      currentSize = {
        width: Math.max(0, msg.columns),
        height: Math.max(0, msg.rows),
      };
    }
    captureSnapshot('update', msg);
    const triggerIndex = handledMessages.length - 1;
    for (const cmd of cmds) {
      bus.runCmd(wrapCommand(cmd, 'update', triggerIndex));
    }
  });

  try {
    const [initModel, initCmds] = app.init();
    model = initModel;
    captureSnapshot('init');
    for (const cmd of initCmds) {
      bus.runCmd(wrapCommand(cmd, 'init', null));
    }
    await bus.drain();
  } catch (error) {
    await teardown();
    throw error;
  }

  return {
    get model() {
      return model;
    },
    get frame() {
      return latestSnapshot().frame;
    },
    get frames() {
      return frames;
    },
    get snapshots() {
      return snapshots;
    },
    get messages() {
      return handledMessages;
    },
    get emittedMessages() {
      return emittedMessages;
    },
    get commands() {
      return commandRecords;
    },
    get elapsed() {
      return clock.now() - start;
    },
    get running() {
      return running && !tornDown;
    },
    snapshot: latestSnapshot,
    settle,
    step: processStep,
    async run(steps) {
      for (const step of steps) {
        if (tornDown || !running) break;
        await processStep(step);
      }
      return settle();
    },
    press(key, delay = 0) {
      return processStep({ key, delay });
    },
    resize(columns, rows, delay = 0) {
      return processStep({ resize: { columns, rows }, delay });
    },
    pulse(dt, delay = 0) {
      return processStep({ pulse: { dt }, delay });
    },
    mouse(message, delay = 0) {
      return processStep({ mouse: message, delay });
    },
    emit(msg, delay = 0) {
      return processStep({ msg, delay });
    },
    teardown,
  };
}

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
  let currentSize = initialSize(ctx);

  if (options?.pulseFps !== false) {
    bus.startPulse(options?.pulseFps ?? ctx?.runtime.refreshRate ?? 60);
  }

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

    const frame = normalizeFrame(app, model, currentSize);
    frames.push(frame);
    options?.onFrame?.(frame, frames.length - 1);
    for (const cmd of cmds) {
      bus.runCmd(cmd);
    }
  });

  try {
    const initFrame = normalizeFrame(app, model, currentSize);
    frames.push(initFrame);
    options?.onFrame?.(initFrame, 0);

    for (const cmd of initCmds) {
      bus.runCmd(cmd);
    }

    await bus.drain();

    for (const step of steps) {
      if (!running) break;

      if (step.delay && step.delay > 0) {
        await sleep(clock, step.delay);
      }

      if (!running) break;

      if ('key' in step) {
        bus.emit(parseKey(step.key));
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
    return {
      model,
      frames,
      elapsed: clock.now() - start,
    };
  } finally {
    bus.stopPulse();
    bus.dispose();
  }
}
