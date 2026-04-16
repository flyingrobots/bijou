/**
 * Scenario interface — a pure, harness-agnostic unit of benchmark work.
 *
 * A scenario describes one kind of render/paint/diff work that we want
 * to measure. It is intentionally decoupled from how it is measured
 * so the same scenario modules can be driven by:
 *
 *   1. The wall-time harness (process-isolated, measures ns per frame)
 *   2. The memory harness (heap snapshots before/after)
 *   3. The interactive sandbox (live rendering with metrics overlay)
 *
 * A scenario is not responsible for timing, measurement, output, or
 * reporting. It only knows how to set up its state and run one frame
 * of work.
 */

import type { Surface, BijouContext } from '@flyingrobots/bijou';

/**
 * A benchmark scenario — one unit of reproducible render/paint/diff
 * work. Parameterized over an opaque `State` type which is private to
 * the scenario and passed opaquely by harnesses.
 */
export interface Scenario<State = unknown> {
  /** Stable machine ID (kebab-case). Used as a key and in file names. */
  readonly id: string;

  /** Human-readable label shown in reports and the sandbox overlay. */
  readonly label: string;

  /**
   * Stable lowercase tags describing what this scenario exercises.
   *
   * Tags are for intent and affected code paths, not visual aesthetics:
   * `diff`, `paint`, `setRGB`, `hex-parse`, `unique-styles`, etc.
   * Harnesses and CLI tools can use them for focused runs.
   */
  readonly tags: readonly string[];

  /**
   * One-paragraph description of what this scenario exercises and
   * what code paths it stresses. Shown in `bench list` and in the
   * RE-017 learnings doc.
   */
  readonly description: string;

  /** Surface width (columns) this scenario operates on. */
  readonly columns: number;

  /** Surface height (rows) this scenario operates on. */
  readonly rows: number;

  /**
   * Default warmup frame count. Harnesses may override. Warmup frames
   * are run before timing starts so JIT optimization stabilizes.
   */
  readonly defaultWarmupFrames: number;

  /**
   * Default measured frame count. Harnesses may override. A scenario
   * should be sized so that this many frames takes ~50-500 ms on
   * reasonable hardware — enough signal to resist noise, fast enough
   * to run many samples.
   */
  readonly defaultMeasureFrames: number;

  /**
   * Build scenario state. Called once per sample (or once per sandbox
   * session). Must not do measured work — it runs outside the timing
   * window.
   *
   * @param ctx - Optional bijou context. Harnesses should provide a
   *   test context so scenarios don't depend on process globals.
   */
  setup(ctx?: BijouContext, columns?: number, rows?: number): State;

  /**
   * Run one frame of the scenario's work. Mutates `state` in place.
   * This is the hot path that harnesses time.
   *
   * @param state - Opaque state from `setup()`.
   * @param frameIndex - Zero-based frame counter. Scenarios that
   *   animate can use this for phase offsets. Pure scenarios ignore it.
   */
  frame(state: State, frameIndex: number): void;

  /**
   * Sandbox harness hook — returns the surface that should be shown
   * to the user interactively, or undefined if the scenario has no
   * visible output. Optional: scenarios that don't care about sandbox
   * rendering can omit this.
   */
  getDisplaySurface?(state: State): Surface | undefined;

  /**
   * Optional teardown hook. Called after all frames are done.
   * Scenarios that hold onto resources (files, timers) should clean
   * up here. Most scenarios don't need this.
   */
  teardown?(state: State): void;
}

/** A scenario that erases its generic State parameter, for registries. */
export type AnyScenario = Scenario<unknown>;

/** One comma-separated AND clause from `--tag=...`. */
export type ScenarioTagGroup = readonly string[];
