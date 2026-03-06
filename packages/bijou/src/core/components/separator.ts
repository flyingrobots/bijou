import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import { resolveCtx } from '../resolve-ctx.js';
import { renderByMode } from '../mode-render.js';

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
  const label = options.label;
  const width = options.width ?? ctx.runtime.columns;

  return renderByMode(ctx.mode, {
    pipe: () => {
      if (label) return `--- ${label} ---`;
      return '---';
    },
    accessible: () => {
      if (label) return `--- ${label} ---`;
      return '';
    },
    interactive: () => {
      const token = options.borderToken ?? ctx.border('muted');

      if (label) {
        const labelWithSpaces = ` ${label} `;
        const remaining = Math.max(0, width - labelWithSpaces.length);
        const left = Math.floor(remaining / 2);
        const right = remaining - left;
        return ctx.style.styled(token, '\u2500'.repeat(left)) + labelWithSpaces + ctx.style.styled(token, '\u2500'.repeat(right));
      }

      return ctx.style.styled(token, '\u2500'.repeat(width));
    },
  }, options);
}
