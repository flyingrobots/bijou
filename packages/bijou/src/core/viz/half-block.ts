import { createSurface, type Surface } from '../../ports/surface.js';
import type { RGB } from '../theme/tokens.js';
import { scaleOklch } from './scales-ext.js';
import type { OklchScale } from './scales.js';

export class HalfBlockCanvas {
  readonly cellWidth: number;
  readonly cellHeight: number;
  readonly pixelWidth: number;
  readonly pixelHeight: number;
  private readonly r: Uint8Array;
  private readonly g: Uint8Array;
  private readonly b: Uint8Array;
  private readonly a: Uint8Array;

  constructor(cellWidth: number, cellHeight: number) {
    this.cellWidth = Math.max(0, Math.floor(cellWidth));
    this.cellHeight = Math.max(0, Math.floor(cellHeight));
    this.pixelWidth = this.cellWidth;
    this.pixelHeight = this.cellHeight * 2;
    const total = this.pixelWidth * this.pixelHeight;
    this.r = new Uint8Array(total);
    this.g = new Uint8Array(total);
    this.b = new Uint8Array(total);
    this.a = new Uint8Array(total);
  }

  clear(): void {
    this.r.fill(0);
    this.g.fill(0);
    this.b.fill(0);
    this.a.fill(0);
  }

  setPixel(px: number, py: number, rgb: RGB): void {
    const x = Math.round(px);
    const y = Math.round(py);
    if (x < 0 || x >= this.pixelWidth || y < 0 || y >= this.pixelHeight) return;
    const idx = y * this.pixelWidth + x;
    this.r[idx] = rgb[0];
    this.g[idx] = rgb[1];
    this.b[idx] = rgb[2];
    this.a[idx] = 1;
  }

  fillRect(px: number, py: number, w: number, h: number, rgb: RGB): void {
    const x0 = Math.max(0, Math.floor(px));
    const y0 = Math.max(0, Math.floor(py));
    const x1 = Math.min(this.pixelWidth, Math.ceil(px + w));
    const y1 = Math.min(this.pixelHeight, Math.ceil(py + h));
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        this.setPixel(x, y, rgb);
      }
    }
  }

  shiftDown(subpixelRows = 1): void {
    const shift = Math.max(1, Math.floor(subpixelRows));
    const stride = this.pixelWidth * shift;
    const total = this.pixelWidth * this.pixelHeight;
    if (stride >= total) {
      this.clear();
      return;
    }
    this.r.copyWithin(stride, 0, total - stride);
    this.g.copyWithin(stride, 0, total - stride);
    this.b.copyWithin(stride, 0, total - stride);
    this.a.copyWithin(stride, 0, total - stride);
    this.r.fill(0, 0, stride);
    this.g.fill(0, 0, stride);
    this.b.fill(0, 0, stride);
    this.a.fill(0, 0, stride);
  }

  flushToSurface(surface: Surface, offsetX = 0, offsetY = 0): void {
    for (let cy = 0; cy < this.cellHeight; cy++) {
      const sy = offsetY + cy;
      if (sy < 0 || sy >= surface.height) continue;
      const topRow = cy * 2;
      const botRow = topRow + 1;
      for (let cx = 0; cx < this.cellWidth; cx++) {
        const sx = offsetX + cx;
        if (sx < 0 || sx >= surface.width) continue;
        const topIdx = topRow * this.pixelWidth + cx;
        const botIdx = botRow * this.pixelWidth + cx;
        const hasTop = (this.a[topIdx] ?? 0) > 0;
        const hasBot = (this.a[botIdx] ?? 0) > 0;
        if (!hasTop && !hasBot) continue;
        const topRGB: RGB = [this.r[topIdx] ?? 0, this.g[topIdx] ?? 0, this.b[topIdx] ?? 0];
        const botRGB: RGB = [this.r[botIdx] ?? 0, this.g[botIdx] ?? 0, this.b[botIdx] ?? 0];
        if (hasTop && hasBot) {
          surface.set(sx, sy, { char: '▀', fgRGB: topRGB, bgRGB: botRGB, empty: false });
        } else if (hasTop) {
          surface.set(sx, sy, { char: '▀', fgRGB: topRGB, empty: false });
        } else {
          surface.set(sx, sy, { char: '▄', fgRGB: botRGB, empty: false });
        }
      }
    }
  }
}

export interface HeatmapOptions {
  readonly width: number;
  readonly height: number;
  readonly data: readonly (readonly number[])[];
  readonly domain?: readonly [number, number];
  readonly colorScale?: OklchScale;
}

export function heatmapSurface(options: HeatmapOptions): Surface {
  const w = Math.max(0, Math.floor(options.width));
  const h = Math.max(0, Math.floor(options.height));
  const surface = createSurface(w, h);
  const rows = options.data.length;
  const cols = options.data[0]?.length ?? 0;
  if (w === 0 || h === 0 || rows === 0 || cols === 0) return surface;

  let minV = Infinity;
  let maxV = -Infinity;
  for (const r of options.data) {
    for (const v of r) {
      if (Number.isFinite(v)) {
        if (v < minV) minV = v;
        if (v > maxV) maxV = v;
      }
    }
  }
  const domain = options.domain ?? (minV <= maxV ? [minV, maxV === minV ? minV + 1 : maxV] : [0, 1]);
  const scale = options.colorScale ? options.colorScale.domain(domain) : scaleOklch(domain);
  const canvas = new HalfBlockCanvas(w, h);
  for (let py = 0; py < canvas.pixelHeight; py++) {
    const rIdx = Math.min(rows - 1, Math.floor((py / Math.max(1, canvas.pixelHeight)) * rows));
    const row = options.data[rIdx] ?? [];
    for (let px = 0; px < canvas.pixelWidth; px++) {
      const cIdx = Math.min(cols - 1, Math.floor((px / Math.max(1, canvas.pixelWidth)) * cols));
      const val = row[cIdx] ?? domain[0];
      canvas.setPixel(px, py, scale(val).rgb);
    }
  }
  canvas.flushToSurface(surface, 0, 0);
  return surface;
}
