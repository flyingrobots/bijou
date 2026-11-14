import {
  isPackedSurface,
  type Surface,
} from '../../ports/surface.js';
import { rgbToHex } from '../theme/color.js';
import type { RGB } from '../theme/tokens.js';

const BRAILLE_OFFSET = 0x2800;

/**
 * Standard Unicode Braille 2x4 sub-pixel bitmask table:
 * Left column (dx=0): bits 0x01, 0x02, 0x04, 0x40
 * Right column (dx=1): bits 0x08, 0x10, 0x20, 0x80
 */
const BRAILLE_LEFT_MASKS: readonly number[] = [0x01, 0x02, 0x04, 0x40];
const BRAILLE_RIGHT_MASKS: readonly number[] = [0x08, 0x10, 0x20, 0x80];

/**
 * Push-based 2W x 4H sub-pixel Braille rasterizer backed by flat typed arrays.
 */
export class BrailleCanvas {
  readonly cellWidth: number;
  readonly cellHeight: number;
  readonly pixelWidth: number;
  readonly pixelHeight: number;
  private readonly dots: Uint8Array;
  private readonly fgRGB: Int16Array;

  constructor(cellWidth: number, cellHeight: number) {
    this.cellWidth = Math.max(0, Math.floor(cellWidth));
    this.cellHeight = Math.max(0, Math.floor(cellHeight));
    this.pixelWidth = this.cellWidth * 2;
    this.pixelHeight = this.cellHeight * 4;
    const totalCells = this.cellWidth * this.cellHeight;
    this.dots = new Uint8Array(totalCells);
    this.fgRGB = new Int16Array(totalCells * 3);
    this.fgRGB.fill(-1);
  }

  /** Clear all sub-pixel dots and cell foreground colours. */
  clear(): void {
    this.dots.fill(0);
    this.fgRGB.fill(-1);
  }

  /** Read the 8-bit Braille bitmask (0x00..0xFF) at cell `(cx, cy)`. */
  getCellMask(cx: number, cy: number): number {
    if (cx < 0 || cx >= this.cellWidth || cy < 0 || cy >= this.cellHeight) return 0;
    return this.dots[cy * this.cellWidth + cx] ?? 0;
  }

  /** Set a single sub-pixel dot at `(px, py)` in `[0..2W-1, 0..4H-1]`. */
  plotDot(px: number, py: number, rgb?: RGB): void {
    const x = Math.round(px);
    const y = Math.round(py);
    if (x < 0 || x >= this.pixelWidth || y < 0 || y >= this.pixelHeight) return;
    const cx = x >> 1;
    const cy = y >> 2;
    const dy = y & 3;
    const idx = cy * this.cellWidth + cx;
    const colMasks = (x & 1) === 0 ? BRAILLE_LEFT_MASKS : BRAILLE_RIGHT_MASKS;
    const bit = colMasks[dy] ?? 0;
    this.dots[idx] = (this.dots[idx] ?? 0) | bit;
    if (rgb) {
      const base = idx * 3;
      this.fgRGB[base] = rgb[0];
      this.fgRGB[base + 1] = rgb[1];
      this.fgRGB[base + 2] = rgb[2];
    }
  }

  /** Integer Bresenham line between `(x0, y0)` and `(x1, y1)` in sub-pixel space. */
  plotLine(x0: number, y0: number, x1: number, y1: number, rgb?: RGB): void {
    let ix0 = Math.round(x0);
    let iy0 = Math.round(y0);
    const ix1 = Math.round(x1);
    const iy1 = Math.round(y1);
    const dx = Math.abs(ix1 - ix0);
    const sx = ix0 < ix1 ? 1 : -1;
    const dy = -Math.abs(iy1 - iy0);
    const sy = iy0 < iy1 ? 1 : -1;
    let err = dx + dy;
    const maxSteps = (dx - dy) + 2;
    for (let step = 0; step < maxSteps; step++) {
      this.plotDot(ix0, iy0, rgb);
      if (ix0 === ix1 && iy0 === iy1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        ix0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        iy0 += sy;
      }
    }
  }

  /** Fill a vertical sub-pixel column span at `px` from `py0` to `py1`. */
  fillColumn(px: number, py0: number, py1: number, rgb?: RGB): void {
    const x = Math.round(px);
    if (x < 0 || x >= this.pixelWidth) return;
    const lo = Math.max(0, Math.min(Math.round(py0), Math.round(py1)));
    const hi = Math.min(this.pixelHeight - 1, Math.max(Math.round(py0), Math.round(py1)));
    for (let y = lo; y <= hi; y++) {
      this.plotDot(x, y, rgb);
    }
  }

  /** Flush non-empty Braille cells onto `surface` at `(offsetX, offsetY)`. */
  flushToSurface(surface: Surface, offsetX = 0, offsetY = 0, fillBlank = false): void {
    const packed = isPackedSurface(surface);
    for (let cy = 0; cy < this.cellHeight; cy++) {
      const sy = offsetY + cy;
      if (sy < 0 || sy >= surface.height) continue;
      for (let cx = 0; cx < this.cellWidth; cx++) {
        const sx = offsetX + cx;
        if (sx < 0 || sx >= surface.width) continue;
        const idx = cy * this.cellWidth + cx;
        const mask = this.dots[idx] ?? 0;
        if (mask === 0 && !fillBlank) continue;
        const code = BRAILLE_OFFSET + mask;
        const base = idx * 3;
        const r = this.fgRGB[base] ?? -1;
        const g = this.fgRGB[base + 1] ?? 0;
        const b = this.fgRGB[base + 2] ?? 0;
        if (packed && isPackedSurface(surface)) {
          surface.setRGB(sx, sy, code, r, g, b, -1, 0, 0);
        } else {
          const char = String.fromCodePoint(code);
          const fg = r >= 0 ? rgbToHex([r, g, b]) : undefined;
          surface.set(sx, sy, { char, fg, fgRGB: r >= 0 ? [r, g, b] : undefined, empty: false });
        }
      }
    }
  }
}
