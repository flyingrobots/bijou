import type { Surface } from '@flyingrobots/bijou';
import type { RenderMiddleware } from '../pipeline.js';

interface PackedSurface extends Surface {
  readonly buffer: Uint8Array;
  readonly sideTable: readonly string[];
}

function isPackedSurface(s: Surface): s is PackedSurface {
  return 'buffer' in s && (s as any).buffer instanceof Uint8Array;
}

// Packed-cell constants inlined to avoid cross-package import
const CELL_STRIDE = 10;
const OFF_FG_R = 2;
const OFF_BG_R = 5;
const OFF_ALPHA = 9;
const FLAG_FG_SET = 1 << 6;
const FLAG_BG_SET = 1 << 7;
/**
 * Creates a post-processing middleware that converts all colors in the
 * target surface to grayscale luminance values.
 *
 * When the surface is backed by a packed buffer, operates directly on
 * bytes — no Cell decode, no hex string parsing, no allocations.
 *
 * @returns A RenderMiddleware for the 'PostProcess' stage.
 */
export function grayscaleFilter(): RenderMiddleware {
  return (state, next) => {
    const { targetSurface } = state;

    if (isPackedSurface(targetSurface)) {
      grayscalePackedBuffer(targetSurface);
    } else {
      grayscaleCellFallback(targetSurface);
    }

    next();
  };
}

function grayscalePackedBuffer(surface: PackedSurface): void {
  const buf = surface.buffer;
  const size = surface.width * surface.height;

  for (let i = 0; i < size; i++) {
    const off = i * CELL_STRIDE;
    const alpha = buf[off + OFF_ALPHA]!;

    if (alpha & FLAG_FG_SET) {
      const r = buf[off + OFF_FG_R]!;
      const g = buf[off + OFF_FG_R + 1]!;
      const b = buf[off + OFF_FG_R + 2]!;
      const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      buf[off + OFF_FG_R] = lum;
      buf[off + OFF_FG_R + 1] = lum;
      buf[off + OFF_FG_R + 2] = lum;
    }

    if (alpha & FLAG_BG_SET) {
      const r = buf[off + OFF_BG_R]!;
      const g = buf[off + OFF_BG_R + 1]!;
      const b = buf[off + OFF_BG_R + 2]!;
      const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      buf[off + OFF_BG_R] = lum;
      buf[off + OFF_BG_R + 1] = lum;
      buf[off + OFF_BG_R + 2] = lum;
    }

    // Sync the Cell object from the buffer
    const cell = surface.cells[i]!;
    if (alpha & FLAG_FG_SET) {
      const lum = buf[off + OFF_FG_R]!;
      const h = lum.toString(16).padStart(2, '0');
      cell.fg = `#${h}${h}${h}`;
    }
    if (alpha & FLAG_BG_SET) {
      const lum = buf[off + OFF_BG_R]!;
      const h = lum.toString(16).padStart(2, '0');
      cell.bg = `#${h}${h}${h}`;
    }
  }
}

function grayscaleCellFallback(surface: Surface): void {
  for (let y = 0; y < surface.height; y++) {
    for (let x = 0; x < surface.width; x++) {
      const cell = surface.get(x, y);
      const newFg = cell.fg ? hexToGrayscale(cell.fg) : undefined;
      const newBg = cell.bg ? hexToGrayscale(cell.bg) : undefined;
      if (newFg !== cell.fg || newBg !== cell.bg) {
        surface.set(x, y, { ...cell, fg: newFg, bg: newBg });
      }
    }
  }
}

function hexToGrayscale(hex: string): string {
  if (hex.length !== 7 || hex[0] !== '#') return hex;

  const digits = hex.slice(1);
  if (!/^[0-9A-Fa-f]{6}$/.test(digits)) return hex;

  const r = parseInt(digits.slice(0, 2), 16);
  const g = parseInt(digits.slice(2, 4), 16);
  const b = parseInt(digits.slice(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) return hex;

  const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

  const hexLum = lum.toString(16).padStart(2, '0');
  return `#${hexLum}${hexLum}${hexLum}`;
}
