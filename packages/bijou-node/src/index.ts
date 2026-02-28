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
import { createBijou, setDefaultContext } from '@flyingrobots/bijou';
import { nodeRuntime } from './runtime.js';
import { nodeIO } from './io.js';
import { chalkStyle } from './style.js';

/** Re-export the Node.js {@link RuntimePort} factory. */
export { nodeRuntime } from './runtime.js';
/** Re-export the Node.js {@link IOPort} factory. */
export { nodeIO } from './io.js';
/** Re-export the Chalk-based {@link StylePort} factory and its options type. */
export { chalkStyle, type ChalkStyleOptions } from './style.js';

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
  return createBijou({
    runtime,
    io: nodeIO(),
    style: chalkStyle(noColor),
  });
}

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
  if (!initialized) {
    const ctx = createNodeContext();
    setDefaultContext(ctx);
    initialized = true;
    return ctx;
  }
  return createNodeContext();
}
