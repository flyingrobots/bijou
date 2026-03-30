/**
 * Shared background-fill utility for components that support `bgToken`.
 *
 * Centralises the guard logic (noColor, pipe, accessible) so every call site
 * stays in sync.
 *
 * @module
 */

import type { BijouContext } from '../ports/context.js';
import { hexToRgb } from './theme/color.js';
import type { TokenValue } from './theme/tokens.js';

// eslint-disable-next-line no-control-regex
const ANSI_SGR_GLOBAL_RE = /\x1b\[([0-9;]*)m/g;
const MARKER = '\u0000';

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

  const wrappedMarker = ctx!.style.bgHex(token.bg!, MARKER);
  const markerIndex = wrappedMarker.indexOf(MARKER);

  if (markerIndex < 0 || wrappedMarker === MARKER) {
    return (text: string) => ctx!.style.bgHex(token.bg!, text);
  }

  const prefix = wrappedMarker.slice(0, markerIndex);
  const suffix = wrappedMarker.slice(markerIndex + MARKER.length);

  if (prefix.length === 0 || suffix.length === 0) {
    return (text: string) => ctx!.style.bgHex(token.bg!, text);
  }

  return (text: string) => wrapPreservingBackground(token.bg!, text, prefix, suffix);
}

function wrapPreservingBackground(
  color: string,
  text: string,
  prefix: string,
  suffix: string,
): string {
  const [r, g, b] = hexToRgb(color);
  const bgOpen = `\x1b[48;2;${r};${g};${b}m`;
  const reapplied = text.replace(ANSI_SGR_GLOBAL_RE, (match, codes) => {
    const parts = codes === '' ? ['0'] : codes.split(';');
    return parts.includes('0') || parts.includes('49')
      ? match + bgOpen
      : match;
  });
  return prefix + reapplied + suffix;
}
