import type { BijouContext } from '@flyingrobots/bijou';
import type { Middleware } from './eventbus.js';
import type { RenderPipeline } from './pipeline/pipeline.js';
import type { SurfaceBudgetThresholds } from './surface-budget.js';
import type { ViewOutput } from './view-output.js';
import type {
  KeyMsg,
  MouseMsg,
  MouseTrackingMode,
  PulseMsg,
  ResizeMsg,
} from './runtime-messages.js';
import type { Cmd, RuntimeIssue } from './runtime-commands.js';

// --- App definition ---

/**
 * TEA (The Elm Architecture) application interface.
 *
 * Define the three core functions: `init` for initial state, `update` for
 * state transitions, and `view` for rendering.
 *
 * @template Model - Application state type.
 * @template M - Custom application message type (defaults to `never`).
 */
export interface App<Model, M = never> {
  /**
   * Return the initial model and startup commands.
   *
   * @returns A tuple of `[initialModel, startupCommands]`.
   */
  init(): [Model, Cmd<M>[]];

  /**
   * Handle a message and return the updated model with commands.
   *
   * @param msg - Incoming message (key, resize, mouse, pulse, or custom).
   * @param model - Current application state.
   * @returns A tuple of `[updatedModel, commands]`.
   */
  update(
    msg: KeyMsg | ResizeMsg | MouseMsg | PulseMsg | M,
    model: Model,
  ): [Model, Cmd<M>[]];

  /**
   * Render the current model as a Surface or LayoutNode.
   *
   * @param model - Current application state.
   * @returns Rendered Surface or Layout tree.
   */
  view(model: Model): ViewOutput;

  /**
   * Optionally translate framework warnings/errors into application messages.
   *
   * This lets higher-level shells surface runtime issues through their own UI
   * while the framework still writes them to stderr as usual.
   */
  routeRuntimeIssue?(issue: RuntimeIssue): M | undefined;
}

// --- Runtime options ---

/** TEA runtime options. */
export interface RunOptions<M = unknown> {
  /** Enter the alternate screen buffer on startup. */
  altScreen?: boolean;
  /** Hide the cursor on startup. */
  hideCursor?: boolean;
  /** Enable mouse input (SGR mode). Default: false. */
  mouse?: boolean;
  /** Mouse mode: `press`, `drag` (default), or hover-capable `any`. */
  mouseMode?: MouseTrackingMode;
  /** Bijou context providing I/O and runtime ports. */
  ctx?: BijouContext;
  /** Optional middleware to intercept or modify messages. */
  middlewares?: Middleware<M>[];
  /** Optional hook to extend the render pipeline with custom middleware. */
  configurePipeline?: (pipeline: RenderPipeline) => void;
  /** Optional non-fatal render budget warnings routed as runtime issues. */
  surfaceBudget?: SurfaceBudgetThresholds;
  /**
   * Pending command count that triggers runtime backpressure diagnostics.
   * Defaults to 1000. Set to 0 to disable the warning.
   */
  commandBackpressureThreshold?: number;
  /** Optional BCSS stylesheet string. */
  css?: string;
}

export * from './runtime-commands.js';
export * from './runtime-messages.js';
