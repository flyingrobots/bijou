import { isPackedSurface, type Surface } from '../../ports/surface.js';
import { colorHex, colorRgb, type ColorRef } from '../theme/color.js';
import { encodeModifiers, CELL_STRIDE, OFF_FLAGS, OFF_ALPHA, FLAG_EMPTY, FLAG_BG_SET } from '../render/packed-cell.js';

/** Pre-parse a CellTextStyle into numeric RGB + flags for setRGB. Returns undefined if not parseable. */
function parseStyleRGB(style: {
  fg?: ColorRef;
  bg?: ColorRef;
  fgRGB?: readonly [number, number, number];
  bgRGB?: readonly [number, number, number];
  modifiers?: string[];
}): {
  fgR: number; fgG: number; fgB: number;
  bgR: number; bgG: number; bgB: number;
  flags: number;
} | undefined {
  let fgR = -1, fgG = 0, fgB = 0;
  let bgR = -1, bgG = 0, bgB = 0;
  const fgRgb = style.fgRGB ?? colorRgb(style.fg);
  if (style.fg != null && fgRgb == null) return undefined;
  if (fgRgb) {
    fgR = fgRgb[0]; fgG = fgRgb[1]; fgB = fgRgb[2];
  }
  const bgRgb = style.bgRGB ?? colorRgb(style.bg);
  if (style.bg != null && bgRgb == null) return undefined;
  if (bgRgb) {
    bgR = bgRgb[0]; bgG = bgRgb[1]; bgB = bgRgb[2];
  }
  return { fgR, fgG, fgB, bgR, bgG, bgB, flags: encodeModifiers(style.modifiers) };
}

const BORDER = { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' };

function normalizeFixedWidth(width: number | undefined): number | undefined {
  if (width == null) return undefined;
  if (!Number.isFinite(width)) return undefined;
  return Math.max(2, Math.floor(width));
}

function withInheritedBackground(surface: Surface, background: ColorRef | undefined): Surface {
  if (background == null) return surface;

  const next = surface.clone();
  if (isPackedSurface(next)) {
    // Fast path: write bg bytes directly into the buffer
    const bgRGB = colorRgb(background);
    if (bgRGB) {
      const buf = next.buffer;
      const [bgR, bgG, bgB] = bgRGB;
      const size = next.width * next.height;
      for (let i = 0; i < size; i++) {
        const off = i * CELL_STRIDE;
        const alpha = buf[off + OFF_ALPHA] ?? 0;
        if ((buf[off + OFF_FLAGS] ?? 0) & FLAG_EMPTY) continue;
        if (alpha & FLAG_BG_SET) continue;
        buf[off + 5] = bgR;
        buf[off + 6] = bgG;
        buf[off + 7] = bgB;
        buf[off + OFF_ALPHA] = alpha | FLAG_BG_SET;
      }
      next.markAllDirty();
      return next;
    }
  }
  for (let y = 0; y < next.height; y++) {
    for (let x = 0; x < next.width; x++) {
      const cell = next.get(x, y);
      if (cell.empty || cell.bg != null) continue;
      next.set(x, y, { ...cell, bg: colorHex(background) });
    }
  }

  return next;
}

export { BORDER, normalizeFixedWidth, parseStyleRGB, withInheritedBackground };
