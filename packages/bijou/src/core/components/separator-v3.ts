import { createSurface, type Surface } from '../../ports/surface.js';
import { resolveSafeCtx as resolveCtx } from '../resolve-ctx.js';
import type { SeparatorOptions } from './separator.js';
import { segmentSurfaceText, tokenToCellStyle } from './surface-text.js';

/**
 * Render a horizontal separator as a Surface for V3-native composition.
 */
export function separatorSurface(options: SeparatorOptions = {}): Surface {
  const ctx = resolveCtx(options.ctx);
  const label = options.label ?? '';
  const token = options.borderToken ?? ctx?.border('muted');
  const borderStyle = tokenToCellStyle(token);
  const labelGraphemes = label.length > 0 ? segmentSurfaceText(` ${label} `, 'separatorSurface label') : [];
  const fallbackWidth = labelGraphemes.length > 0 ? labelGraphemes.length : 3;
  const width = Math.max(0, Math.floor(options.width ?? ctx?.runtime.columns ?? fallbackWidth));
  const surface = createSurface(width, 1);

  if (width === 0) return surface;

  const setBorder = (x: number, char: string): void => {
    surface.set(x, 0, { char, ...borderStyle, empty: false });
  };
  const setPlain = (x: number, char: string): void => {
    surface.set(x, 0, { char, empty: false });
  };

  if (label.length === 0) {
    for (let x = 0; x < width; x++) setBorder(x, '\u2500');
    return surface;
  }

  if (labelGraphemes.length >= width) {
    for (let x = 0; x < width; x++) {
      setPlain(x, labelGraphemes[x] ?? ' ');
    }
    return surface;
  }

  const remaining = width - labelGraphemes.length;
  const left = Math.floor(remaining / 2);
  const right = remaining - left;

  for (let x = 0; x < left; x++) setBorder(x, '\u2500');
  for (let i = 0; i < labelGraphemes.length; i++) setPlain(left + i, labelGraphemes[i]!);
  for (let x = 0; x < right; x++) setBorder(left + labelGraphemes.length + x, '\u2500');

  return surface;
}
