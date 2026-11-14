import { isPackedSurface, type Surface } from '../../ports/surface.js';
import { rgbToHex } from '../theme/color.js';
import type { RGB } from '../theme/tokens.js';

const BRAILLE_OFFSET = 0x2800;
const BRAILLE_LEFT_MASKS: readonly number[] = [0x01, 0x02, 0x04, 0x40];
const BRAILLE_RIGHT_MASKS: readonly number[] = [0x08, 0x10, 0x20, 0x80];

function clipLiangBarsky(
  x0: number, y0: number, x1: number, y1: number, xMax: number, yMax: number,
): readonly [number, number, number, number] | null {
  const dx = x1 - x0, dy = y1 - y0;
  let t0 = 0, t1 = 1;
  const edges: readonly [number, number][] = [[-dx, x0], [dx, xMax - x0], [-dy, y0], [dy, yMax - y0]];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return null;
      continue;
    }
    const r = q / p;
    if (p < 0) {
      if (r > t1) return null;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return null;
      if (r < t1) t1 = r;
    }
  }
  return [x0 + t0 * dx, y0 + t0 * dy, x0 + t1 * dx, y0 + t1 * dy];
}

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

  clear(): void {
    this.dots.fill(0);
    this.fgRGB.fill(-1);
  }

  getCellMask(cx: number, cy: number): number {
    if (cx < 0 || cx >= this.cellWidth || cy < 0 || cy >= this.cellHeight) return 0;
    return this.dots[cy * this.cellWidth + cx] ?? 0;
  }

  plotDot(px: number, py: number, rgb?: RGB): void {
    if (!Number.isFinite(px) || !Number.isFinite(py)) return;
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

  plotLine(x0: number, y0: number, x1: number, y1: number, rgb?: RGB): void {
    if (this.pixelWidth <= 0 || this.pixelHeight <= 0) return;
    if (!Number.isFinite(x0) || !Number.isFinite(y0) || !Number.isFinite(x1) || !Number.isFinite(y1)) return;
    const clipped = clipLiangBarsky(x0, y0, x1, y1, this.pixelWidth - 1, this.pixelHeight - 1);
    if (!clipped) return;
    let ix0 = Math.round(clipped[0]);
    let iy0 = Math.round(clipped[1]);
    const ix1 = Math.round(clipped[2]);
    const iy1 = Math.round(clipped[3]);
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
      if (e2 >= dy) { err += dy; ix0 += sx; }
      if (e2 <= dx) { err += dx; iy0 += sy; }
    }
  }

  fillColumn(px: number, py0: number, py1: number, rgb?: RGB): void {
    if (!Number.isFinite(px) || !Number.isFinite(py0) || !Number.isFinite(py1)) return;
    const x = Math.round(px);
    if (x < 0 || x >= this.pixelWidth) return;
    const lo = Math.max(0, Math.min(Math.round(py0), Math.round(py1)));
    const hi = Math.min(this.pixelHeight - 1, Math.max(Math.round(py0), Math.round(py1)));
    for (let y = lo; y <= hi; y++) this.plotDot(x, y, rgb);
  }

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
        const r = this.fgRGB[base] ?? -1, g = this.fgRGB[base + 1] ?? 0, b = this.fgRGB[base + 2] ?? 0;
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
