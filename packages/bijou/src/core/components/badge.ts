import type { BijouContext } from '../../ports/context.js';
import type { TokenValue, BaseStatusKey } from '../theme/tokens.js';
import { resolveSafeCtx as resolveCtx } from '../resolve-ctx.js';
import { renderByMode } from '../mode-render.js';

/** Badge color variant — any status key, plus `'accent'` and `'primary'`. */
export type BadgeVariant = BaseStatusKey | 'accent' | 'primary';

/** Configuration for rendering a badge. */
export interface BadgeOptions {
  /** Color variant (defaults to `'info'`). */
  variant?: BadgeVariant;
  /** Bijou context for I/O, styling, and mode detection. */
  ctx?: BijouContext;
}

/**
 * Render an inline badge (pill-shaped label) for the given text.
 *
 * Output adapts to the current output mode:
 * - `interactive` / `static` — inverse-colored pill using the variant token.
 * - `pipe` — bracketed text like `[OK]`.
 * - `accessible` — plain text.
 *
 * Falls back to a plain space-padded string when no context or theme is available.
 *
 * @param text - Label to display inside the badge.
 * @param options - Badge configuration.
 * @returns The rendered badge string.
 */
export function badge(text: string, options: BadgeOptions = {}): string {
  const ctx = resolveCtx(options.ctx);
  if (!ctx) return ` ${text} `;

  const variant = options.variant ?? 'info';

  return renderByMode(ctx.mode, {
    pipe: () => `[${text}]`,
    accessible: () => text,
    interactive: () => {
      const baseToken = (variant === 'accent' || variant === 'primary')
        ? ctx.semantic(variant)
        : ctx.status(variant);

      const inverseToken: TokenValue = {
        hex: baseToken.hex,
        modifiers: [...(baseToken.modifiers ?? []), 'inverse'],
      };

      return ctx.style.styled(inverseToken, ` ${text} `);
    },
  }, options);
}
