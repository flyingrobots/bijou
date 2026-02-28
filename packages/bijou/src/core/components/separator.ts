import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import { getDefaultContext } from '../../context.js';

/** Configuration for rendering a horizontal separator line. */
export interface SeparatorOptions {
  /** Optional centered label text. */
  label?: string;
  /** Total width in characters (defaults to terminal column count). */
  width?: number;
  /** Theme token applied to the separator line. */
  borderToken?: TokenValue;
  /** Bijou context for I/O, styling, and mode detection. */
  ctx?: BijouContext;
}

/**
 * Resolve the provided context or fall back to the global default.
 *
 * @param ctx - Optional context override.
 * @returns The resolved {@link BijouContext}.
 */
function resolveCtx(ctx?: BijouContext): BijouContext {
  if (ctx) return ctx;
  return getDefaultContext();
}

/**
 * Render a horizontal separator line, optionally centered around a label.
 *
 * Output adapts to the current output mode:
 * - `interactive` / `static` — styled horizontal rule using `\u2500`.
 * - `pipe` — dashes with or without label (`--- label ---`).
 * - `accessible` — label with dashes, or empty string when no label.
 *
 * @param options - Separator configuration.
 * @returns The rendered separator string.
 */
export function separator(options: SeparatorOptions = {}): string {
  const ctx = resolveCtx(options.ctx);
  const mode = ctx.mode;
  const label = options.label;
  const width = options.width ?? ctx.runtime.columns;

  if (mode === 'pipe') {
    if (label) return `--- ${label} ---`;
    return '---';
  }

  if (mode === 'accessible') {
    if (label) return `--- ${label} ---`;
    return '';
  }

  const token = options.borderToken ?? ctx.theme.theme.border.muted;

  if (label) {
    const labelWithSpaces = ` ${label} `;
    const remaining = Math.max(0, width - labelWithSpaces.length);
    const left = Math.floor(remaining / 2);
    const right = remaining - left;
    return ctx.style.styled(token, '\u2500'.repeat(left)) + labelWithSpaces + ctx.style.styled(token, '\u2500'.repeat(right));
  }

  return ctx.style.styled(token, '\u2500'.repeat(width));
}
