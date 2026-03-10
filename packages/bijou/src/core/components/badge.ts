import { createSurface, type Surface, type Cell } from '../../ports/surface.js';
import type { BaseStatusKey } from '../theme/tokens.js';
import { resolveSafeCtx as resolveCtx } from '../resolve-ctx.js';
import { segmentGraphemes } from '../text/grapheme.js';
import type { BijouNodeOptions } from './types.js';

/** Badge color variant — any status key, plus `'accent'` and `'primary'`. */
export type BadgeVariant = BaseStatusKey | 'accent' | 'primary';

/** Configuration for rendering a badge. */
export interface BadgeOptions extends BijouNodeOptions {
  /** Color variant (defaults to `'info'`). */
  variant?: BadgeVariant;
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

  // Resolve global CSS styles
  const bcss = ctx.resolveBCSS({ type: 'Badge', id: options.id, classes: options.class?.split(' ') });

  const baseToken = (variant === 'accent' || variant === 'primary')
    ? ctx.semantic(variant)
    : ctx.status(variant);

  const cell: Cell = {
    char: ' ',
    fg: bcss['color'] ?? baseToken.hex,
    bg: bcss['background'] ?? undefined,
    modifiers: [...(baseToken.modifiers ?? []), 'inverse'],
    empty: false
  };

  // If CSS background is set, we might want to disable 'inverse' modifier 
  // since the user is being explicit about the BG color.
  if (bcss['background']) {
    cell.modifiers = cell.modifiers?.filter(m => m !== 'inverse');
  }

  for (let i = 0; i < width; i++) {
    surface.set(i, 0, { ...cell, char: graphemes[i]! });
  }

  return surface;
}

// Helper needed for the fallback
import { stringToSurface } from '../render/differ.js';
