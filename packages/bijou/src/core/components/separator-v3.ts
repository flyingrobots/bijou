import { createSurface, isPackedSurface, type Surface, type PackedSurface } from '../../ports/surface.js';
import { resolveSafeCtx as resolveCtx } from '../resolve-ctx.js';
import { sanitizeNonNegativeInt } from '../numeric.js';
import type { SeparatorOptions } from './separator.js';
import { segmentSurfaceText, tokenToCellStyle } from './surface-text.js';
import { parseHex, encodeModifiers } from '../render/packed-cell.js';

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
  const width = sanitizeNonNegativeInt(options.width, ctx?.runtime.columns ?? fallbackWidth);
  const surface = createSurface(width, 1);

  if (width === 0) return surface;

  // Pre-parse border style for setRGB fast path
  const packed = isPackedSurface(surface);
  let bfgR = -1, bfgG = 0, bfgB = 0, bbgR = -1, bbgG = 0, bbgB = 0, bflags = 0;
  if (packed && borderStyle.fg) {
    const rgb = parseHex(borderStyle.fg);
    if (rgb) { bfgR = rgb[0]; bfgG = rgb[1]; bfgB = rgb[2]; }
  }
  if (packed && borderStyle.bg) {
    const rgb = parseHex(borderStyle.bg);
    if (rgb) { bbgR = rgb[0]; bbgG = rgb[1]; bbgB = rgb[2]; }
  }
  if (packed) bflags = encodeModifiers(borderStyle.modifiers);
  const useRGB = packed && (bfgR >= 0 || borderStyle.fg === undefined);

  if (label.length === 0) {
    if (useRGB) {
      for (let x = 0; x < width; x++) (surface as PackedSurface).setRGB(x, 0, '\u2500', bfgR, bfgG, bfgB, bbgR, bbgG, bbgB, bflags);
    } else {
      for (let x = 0; x < width; x++) surface.set(x, 0, { char: '\u2500', ...borderStyle, empty: false });
    }
    return surface;
  }

  if (labelGraphemes.length >= width) {
    for (let x = 0; x < width; x++) {
      if (useRGB) (surface as PackedSurface).setRGB(x, 0, labelGraphemes[x] ?? ' ', -1, 0, 0, -1, 0, 0);
      else surface.set(x, 0, { char: labelGraphemes[x] ?? ' ', empty: false });
    }
    return surface;
  }

  const remaining = width - labelGraphemes.length;
  const left = Math.floor(remaining / 2);
  const right = remaining - left;

  if (useRGB) {
    const ps = surface as PackedSurface;
    for (let x = 0; x < left; x++) ps.setRGB(x, 0, '\u2500', bfgR, bfgG, bfgB, bbgR, bbgG, bbgB, bflags);
    for (let i = 0; i < labelGraphemes.length; i++) ps.setRGB(left + i, 0, labelGraphemes[i]!, -1, 0, 0, -1, 0, 0);
    for (let x = 0; x < right; x++) ps.setRGB(left + labelGraphemes.length + x, 0, '\u2500', bfgR, bfgG, bfgB, bbgR, bbgG, bbgB, bflags);
  } else {
    for (let x = 0; x < left; x++) surface.set(x, 0, { char: '\u2500', ...borderStyle, empty: false });
    for (let i = 0; i < labelGraphemes.length; i++) surface.set(left + i, 0, { char: labelGraphemes[i]!, empty: false });
    for (let x = 0; x < right; x++) surface.set(left + labelGraphemes.length + x, 0, { char: '\u2500', ...borderStyle, empty: false });
  }

  return surface;
}
