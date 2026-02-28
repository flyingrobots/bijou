import type { BijouContext } from './ports/context.js';

let defaultContext: BijouContext | null = null;

/**
 * Retrieve the global default {@link BijouContext}.
 *
 * @returns The currently configured default context.
 * @throws {Error} If no context has been set via {@link setDefaultContext}
 *   or by importing `@flyingrobots/bijou-node`.
 */
export function getDefaultContext(): BijouContext {
  if (defaultContext === null) {
    throw new Error(
      '[bijou] No default context configured. ' +
      'Import @flyingrobots/bijou-node to auto-configure, ' +
      'or call setDefaultContext() explicitly.',
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
 * Reset the default context to `null`.
 *
 * **Test-only** — ensures isolation between test cases.
 */
export function _resetDefaultContextForTesting(): void {
  defaultContext = null;
}
