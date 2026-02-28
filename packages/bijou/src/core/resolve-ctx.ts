/**
 * Shared context resolution helpers used by all bijou components.
 *
 * @module
 */

import type { BijouContext } from '../ports/context.js';
import { getDefaultContext } from '../context.js';

/**
 * Resolve the provided context or fall back to the global default.
 *
 * This is the standard resolver used by most components. It throws if no
 * context is provided and no default has been configured via
 * {@link setDefaultContext}.
 *
 * @param ctx - Optional context override.
 * @returns The resolved {@link BijouContext}.
 */
export function resolveCtx(ctx?: BijouContext): BijouContext {
  if (ctx) return ctx;
  return getDefaultContext();
}

/**
 * Resolve a BijouContext, falling back to the global default.
 *
 * Unlike {@link resolveCtx}, this variant returns `undefined` instead of
 * throwing when no context is provided and no default is configured. This
 * allows components to degrade gracefully (e.g. before bijou-node
 * initialisation).
 *
 * @param ctx - Optional explicit context.
 * @returns The resolved {@link BijouContext}, or `undefined` if unavailable.
 */
export function resolveSafeCtx(ctx?: BijouContext): BijouContext | undefined {
  if (ctx) return ctx;
  try {
    return getDefaultContext();
  } catch {
    return undefined;
  }
}
