import type { BijouContext } from './ports/context.js';

let defaultContext: BijouContext | null = null;
let defaultContextInitializer: (() => BijouContext) | null = null;

/**
 * Retrieve the global default {@link BijouContext}.
 *
 * @returns The currently configured default context.
 * @throws {Error} If no context has been set via {@link setDefaultContext}
 *   or by importing `@flyingrobots/bijou-node`.
 */
export function getDefaultContext(): BijouContext {
  if (defaultContext === null) {
    if (defaultContextInitializer != null) {
      defaultContext = defaultContextInitializer();
      return defaultContext;
    }
    throw new Error(
      '[bijou] No default context configured. ' +
      'Import @flyingrobots/bijou-node to register Node auto-init, ' +
      'call startApp(app), or call setDefaultContext() explicitly. ' +
      'Guide: https://github.com/flyingrobots/bijou/tree/main/packages/bijou-node/GUIDE.md#basic-setup',
    );
  }
  return defaultContext;
}

/**
 * Set the global default {@link BijouContext}.
 *
 * Typically called once at startup by an adapter package (e.g. bijou-node).
 * After this call, components that omit the optional `ctx` parameter will
 * use the context provided here.
 *
 * @param ctx - The context to set as the global default.
 */
export function setDefaultContext(ctx: BijouContext): void {
  defaultContext = ctx;
}

/**
 * Register a lazy initializer for the global default {@link BijouContext}.
 *
 * Host adapters can use this to provide ambient context bootstrapping without
 * forcing higher-level runtime packages to depend on host-specific modules.
 *
 * The initializer is invoked only when {@link getDefaultContext} is called and
 * no explicit default has been set yet.
 *
 * @param initializer - Lazy factory for the default context, or `null` to clear it.
 */
export function setDefaultContextInitializer(
  initializer: (() => BijouContext) | null,
): void {
  defaultContextInitializer = initializer;
}

/**
 * Reset the default context and lazy initializer.
 *
 * **Test-only** — ensures isolation between test cases.
 */
export function _resetDefaultContextForTesting(): void {
  defaultContext = null;
  defaultContextInitializer = null;
}
