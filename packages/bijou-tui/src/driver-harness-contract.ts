import type { Surface } from '@flyingrobots/bijou';
import type { BusMsg } from './eventbus.js';
import type { MouseMsg } from './types.js';
import type {
  RunScriptOptions,
  ScriptStep,
} from './driver-script-contract.js';

/** Options for the interactive test runtime. */
export type TestRuntimeOptions = RunScriptOptions;

/** Final outcome recorded for a command observed by a test runtime. */
export type TestRuntimeCommandResolution =
  | 'pending'
  | 'message'
  | 'quit'
  | 'cleanup'
  | 'void'
  | 'rejected';

/**
 * Recorded command behavior captured by a test harness.
 *
 * `emitted` contains messages pushed through the command's `emit()` callback,
 * while `result` records the command's final return value when it settles.
 */
export interface TestRuntimeCommandRecord<M> {
  /** Stable id assigned in runtime execution order. */
  readonly id: number;
  /** Whether the command originated from `init()` or an `update()` turn. */
  readonly source: 'init' | 'update';
  /** Index into the handled messages for update-triggered commands. */
  readonly triggerIndex: number | null;
  /** Messages emitted incrementally through `emit(msg)`. */
  readonly emitted: readonly M[];
  /** How the command ultimately settled. */
  readonly resolution: TestRuntimeCommandResolution;
  /** Final returned value when the command settled with a value or error. */
  readonly result?: unknown;
  /** Whether runtime teardown disposed the command's cleanup handle. */
  readonly cleanedUp: boolean;
  /** Whether the command has finished executing. */
  readonly settled: boolean;
}

/** Render/model checkpoint captured by a test harness. */
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

/** Interactive, inspectable test harness for a TEA runtime. */
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
  resize(
    columns: number,
    rows: number,
    delay?: number,
  ): Promise<TestRuntimeSnapshot<Model, M>>;
  /** Emit a pulse step. */
  pulse(dt: number, delay?: number): Promise<TestRuntimeSnapshot<Model, M>>;
  /** Emit a mouse step. */
  mouse(
    message: MouseMsg,
    delay?: number,
  ): Promise<TestRuntimeSnapshot<Model, M>>;
  /** Emit a custom application message directly. */
  emit(msg: M, delay?: number): Promise<TestRuntimeSnapshot<Model, M>>;
  /** Stop the runtime and dispose retained command cleanups. */
  teardown(): Promise<void>;
}
