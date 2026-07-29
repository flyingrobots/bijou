/**
 * Node.js adapter package for bijou.
 *
 * Re-exports the individual port adapters ({@link nodeRuntime},
 * {@link nodeIO}, {@link chalkStyle}) and provides convenience
 * functions for constructing a fully-wired {@link BijouContext}
 * bound to the current Node.js process.
 *
 * @packageDocumentation
 */

import type { BijouContext } from '@flyingrobots/bijou';
import {
  resolveSafeCtx,
  setDefaultContext,
  setDefaultContextInitializer,
} from '@flyingrobots/bijou';
import { run, type App, type RunOptions } from '@flyingrobots/bijou-tui';
import { createNodeContext } from './node-context.js';
import type {
  CreateNodeContextOptions,
  InitDefaultContextOptions,
} from './options.js';

/** Re-export the Node.js {@link RuntimePort} factory. */
export { nodeRuntime, detectRefreshRate } from './runtime.js';
/** Re-export the Node.js {@link IOPort} factory. */
export {
  nodeIO,
  scopedNodeIO,
  ScopedNodeIOError,
  type ScopedNodeIO,
  type ScopedNodeIOOptions,
  type NodeIOOptions,
  type NodeWriteStream,
} from './io.js';
/** Re-export the Chalk-based {@link StylePort} factory and its options type. */
export { chalkStyle, type ChalkStyleOptions } from './style.js';
export type {
  CreateNodeContextOptions,
  InitDefaultContextOptions,
  NodeThemeEntry,
  NodeThemeMode,
  NodeThemeOptions,
} from './options.js';
export { createNodeContext } from './node-context.js';

/** Re-export Worker utilities for multi-threaded applications. */
export { isBijouWorker, runInWorker, sendToMain, startWorkerApp, type RunWorkerOptions } from './worker/worker.js';
export {
  recordDemoGif,
  rasterizeSurface,
  writeSurfaceGif,
  type NativeDemoSpec,
  type RecorderResult,
  type SurfaceGifOptions,
} from './recorder.js';

/** Structured bootstrap failure for Node host initialization. */
export class BijouBootstrapError extends Error {
  /** Human-readable reason for the failure. */
  readonly reason: string;
  /** Practical hint to recover from the failure. */
  readonly hint: string;
  /** Original error that triggered this bootstrap error, when available. */
  public override cause?: unknown;

  /**
   * @param reason - Root cause summary.
   * @param hint - Suggested recovery path.
   * @param cause - Optional originating error.
   */
  constructor(reason: string, hint: string, cause?: unknown) {
    super(`initDefaultContext failed: ${reason}`);
    this.name = 'BijouBootstrapError';
    this.reason = reason;
    this.hint = hint;
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

/** Options for {@link startApp}. */
export type StartAppOptions<M = unknown> = RunOptions<M> & CreateNodeContextOptions;

interface SelfRunningApp<M = unknown> {
  run(options?: RunOptions<M>): Promise<void>;
}

function isSelfRunningApp<M>(app: App<unknown, M>): app is App<unknown, M> & SelfRunningApp<M> {
  return 'run' in app && typeof app.run === 'function';
}

/** Test-only helper that restores the Node ambient-context initializer after resets. */
export function _registerDefaultContextInitializerForTesting(): void {
  setDefaultContextInitializer(() => createNodeContext());
}

_registerDefaultContextInitializerForTesting();

/**
 * Guard flag ensuring {@link initDefaultContext} only registers the global
 * default context once per process lifetime.
 */
let initialized = false;

/**
 * Reset the initialization guard.
 *
 * **Test-only** -- allows test suites to re-trigger
 * {@link initDefaultContext}'s first-call behavior.
 */
export function _resetInitializedForTesting(): void {
  initialized = false;
}

/**
 * Initialize and register the global default {@link BijouContext}.
 *
 * On the first call, creates a Node.js context via {@link createNodeContext}
 * and registers it with `setDefaultContext` for ambient `ctx` use.
 *
 * Subsequent calls return a fresh (unregistered) context without
 * overwriting the global default.
 *
 * @returns The {@link BijouContext} created during initialization, or a
 *   fresh context on subsequent calls.
 */
export function initDefaultContext(options: InitDefaultContextOptions = {}): BijouContext {
  const stdoutColumns = process.stdout.columns;
  const stdoutRows = process.stdout.rows;
  if (stdoutColumns === 0 || stdoutRows === 0) {
    throw new BijouBootstrapError(
      'stdout reported zero columns/rows',
      'stdout is not a TTY — use pipe mode or redirect to a file, or run in a real terminal.',
    );
  }

  try {
    const hasExplicitOptions =
      options.theme !== undefined
      || options.presets !== undefined
      || options.envVar !== undefined
      || options.themes !== undefined
      || options.themeMode !== undefined
      || options.themeOverride !== undefined || options.io !== undefined || options.nodeIO !== undefined;
    if (!initialized && !hasExplicitOptions) {
      const existing = resolveSafeCtx();
      if (existing != null) {
        initialized = true;
        return existing;
      }
    }
    if (!initialized) {
      const ctx = createNodeContext(options);
      setDefaultContext(ctx);
      initialized = true;
      return ctx;
    }
    return createNodeContext(options);
  } catch (error) {
    if (error instanceof BijouBootstrapError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    const reason = `Could not initialize Node host context: ${message}`;
    const hint =
      message.includes('setRawMode')
        ? 'raw mode unavailable — run in an interactive terminal rather than a non-TTY pipeline.'
        : 'check the active terminal environment and rerun, or start in a supported TTY context.';

    throw new BijouBootstrapError(reason, hint, error);
  }
}

/**
 * Start a Bijou TUI app on the current Node.js host.
 *
 * This is the first-app convenience path for Node hosts. When no context is
 * provided, it initializes and registers the default Node context so apps that
 * rely on ambient `ctx` resolution still behave correctly. Callers that need
 * explicit ownership can pass `options.ctx` directly. Self-running framed apps
 * are delegated to their hosted runner instead of being forced through raw
 * `run(app, ...)`.
 *
 * @param app - The TEA application to run.
 * @param options - Runtime options forwarded to {@link run}.
 */
export async function startApp<Model, M>(
  app: App<Model, M>,
  options?: StartAppOptions<M>,
): Promise<void> {
  const {
    ctx: explicitCtx,
    theme,
    presets,
    envVar,
    themes,
    themeMode,
    themeOverride,
    io: ioOverride,
    nodeIO: nodeIOOptions,
    ...runOptions
  } = options ?? {};
  let ctx = explicitCtx;
  if (!ctx) {
    if (
      theme !== undefined
      || presets !== undefined
      || envVar !== undefined
      || themes !== undefined
      || themeMode !== undefined
      || themeOverride !== undefined
      || ioOverride !== undefined
      || nodeIOOptions !== undefined
    ) {
      ctx = createNodeContext({
        theme,
        presets,
        envVar,
        themes,
        themeMode,
        themeOverride,
        io: ioOverride,
        nodeIO: nodeIOOptions,
      });
      setDefaultContext(ctx);
      initialized = true;
    } else {
      ctx = initDefaultContext();
    }
  }
  if (isSelfRunningApp(app)) {
    await app.run({ ...runOptions, ctx });
    return;
  }
  await run(app, { ...runOptions, ctx });
}
