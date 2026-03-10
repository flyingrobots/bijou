import { createSurface, type Surface, type Cell } from '../../ports/surface.js';
import type { BijouContext } from '../../ports/context.js';
import type { BaseStatusKey } from '../theme/tokens.js';
import { resolveSafeCtx as resolveCtx } from '../resolve-ctx.js';
import { segmentGraphemes } from '../text/grapheme.js';

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
 * Returns a Surface containing the styled badge.
 *
 * @param text - Label to display inside the badge.
 * @param options - Badge configuration.
 * @returns The rendered badge Surface.
 */
export function badge(text: string, options: BadgeOptions = {}): Surface {
  const ctx = resolveCtx(options.ctx);
  const variant = options.variant ?? 'info';
  
  const paddedText = ` ${text} `;
  const graphemes = segmentGraphemes(paddedText);
  const width = graphemes.length;
  const surface = createSurface(width, 1);

  if (!ctx || ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    // Basic text output for non-rich modes
    const char = ctx?.mode === 'pipe' ? `[${text}]` : paddedText;
    return stringToSurface(char, char.length, 1);
  }

  const baseToken = (variant === 'accent' || variant === 'primary')
    ? ctx.semantic(variant)
    : ctx.status(variant);

  const cell: Cell = {
    char: ' ',
    fg: baseToken.hex,
    modifiers: [...(baseToken.modifiers ?? []), 'inverse'],
    empty: false
  };

  for (let i = 0; i < width; i++) {
    surface.set(i, 0, { ...cell, char: graphemes[i]! });
  }

  return surface;
}

// Helper needed for the fallback
import { stringToSurface } from '../render/differ.js';
