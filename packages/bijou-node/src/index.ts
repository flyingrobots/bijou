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
  createBijou,
  resolveSafeCtx,
  setDefaultContext,
  setDefaultContextInitializer,
} from '@flyingrobots/bijou';
import { run, type App, type RunOptions } from '@flyingrobots/bijou-tui';
import { nodeRuntime } from './runtime.js';
import { nodeIO } from './io.js';
import { chalkStyle } from './style.js';

/** Re-export the Node.js {@link RuntimePort} factory. */
export { nodeRuntime, detectRefreshRate } from './runtime.js';
/** Re-export the Node.js {@link IOPort} factory. */
export {
  nodeIO,
  scopedNodeIO,
  ScopedNodeIOError,
  type ScopedNodeIO,
  type ScopedNodeIOOptions,
} from './io.js';
/** Re-export the Chalk-based {@link StylePort} factory and its options type. */
export { chalkStyle, type ChalkStyleOptions } from './style.js';

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

/** Options for {@link startApp}. Mirrors {@link RunOptions}. */
export type StartAppOptions<M = any> = RunOptions<M>;

interface SelfRunningApp<M = unknown> {
  run(options?: RunOptions<M>): Promise<void>;
}

function isSelfRunningApp<M>(app: App<unknown, M>): app is App<unknown, M> & SelfRunningApp<M> {
  return typeof (app as unknown as SelfRunningApp<M>).run === 'function';
}

/** Test-only helper that restores the Node ambient-context initializer after resets. */
export function _registerDefaultContextInitializerForTesting(): void {
  setDefaultContextInitializer(() => createNodeContext());
}

/**
 * Create a {@link BijouContext} wired to Node.js adapters.
 *
 * Assembles {@link nodeRuntime}, {@link nodeIO}, and {@link chalkStyle}
 * into a single context via `createBijou`. Automatically respects the
 * `NO_COLOR` environment variable by passing it through to the style
 * adapter.
 *
 * @returns A fresh {@link BijouContext} backed by the current Node.js process.
 */
export function createNodeContext(): BijouContext {
  const runtime = nodeRuntime();
  const noColor = runtime.env('NO_COLOR') !== undefined;
  // Force level 3 (truecolor) if NO_COLOR is not set, 
  // as the user is explicitly requesting a rich dashboard experience.
  return createBijou({
    runtime,
    io: nodeIO(),
    style: chalkStyle({ noColor, level: noColor ? 0 : 3 }),
  });
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
 * and registers it with `setDefaultContext` so that bijou components
 * omitting the optional `ctx` parameter automatically use it.
 *
 * Subsequent calls return a fresh (unregistered) context without
 * overwriting the global default.
 *
 * @returns The {@link BijouContext} created during initialization, or a
 *   fresh context on subsequent calls.
 */
export function initDefaultContext(): BijouContext {
  const existing = resolveSafeCtx();
  if (!initialized && existing != null) {
    initialized = true;
    return existing;
  }
  if (!initialized) {
    const ctx = createNodeContext();
    setDefaultContext(ctx);
    initialized = true;
    return ctx;
  }
  return createNodeContext();
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
  const ctx = options?.ctx ?? initDefaultContext();
  if (isSelfRunningApp(app)) {
    await app.run({ ...options, ctx });
    return;
  }
  await run(app, { ...options, ctx });
}
