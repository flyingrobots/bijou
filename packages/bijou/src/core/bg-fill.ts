/**
 * Shared background-fill utility for components that support `bgToken`.
 *
 * Centralises the guard logic (noColor, pipe, accessible) so every call site
 * stays in sync.
 *
 * @module
 */

import type { BijouContext } from '../ports/context.js';
import type { TokenValue } from './theme/tokens.js';

/**
 * Determine whether background color should be applied in the current context.
 *
 * Returns `false` when the context is missing, `noColor` is enabled, or the
 * output mode is `pipe` or `accessible`.
 *
 * @param ctx - Bijou context (may be undefined).
 * @returns `true` when it is safe to emit background ANSI sequences.
 */
export function shouldApplyBg(ctx: BijouContext | undefined): boolean {
  if (!ctx) return false;
  if (ctx.theme.noColor) return false;
  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') return false;
  return true;
}

/**
 * Create a background-fill wrapper function that routes through StylePort.
 *
 * Returns `undefined` when the background should not be applied (missing
 * token/bg, missing context, noColor, pipe mode, or accessible mode).
 *
 * @param token - Token with optional `bg` hex color.
 * @param ctx - Bijou context for styled output.
 * @returns Wrapper function, or `undefined` if bg should not be applied.
 */
export function makeBgFill(
  token: TokenValue | undefined,
  ctx: BijouContext | undefined,
): ((text: string) => string) | undefined {
  if (!token?.bg || !shouldApplyBg(ctx)) return undefined;
  return (text: string) => ctx!.style.bgHex(token.bg!, text);
}
