import { DEFAULT_CELL_ASPECT_RATIO, DEFAULT_CONTRAST, DEFAULT_THRESHOLD, MAX_CONTRAST, MIN_CONTRAST } from './raster-glyph.part01.js';

import type { RasterGlyphDitherMode } from './raster-glyph.part01.js';
export function sanitizeCellAspectRatio(value: number | undefined): number {
  if (value === undefined) return DEFAULT_CELL_ASPECT_RATIO;
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_CELL_ASPECT_RATIO;
  return value;
}
export function sanitizeZoom(value: number | undefined): number {
  if (value === undefined) return 1;
  if (!Number.isFinite(value) || value <= 0) return 1;
  return value;
}
export function sanitizePan(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 0;
  return value;
}
export function sanitizeContrast(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    return DEFAULT_CONTRAST;
  }
  return clampRange(value, MIN_CONTRAST, MAX_CONTRAST);
}
export function sanitizeThreshold(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return DEFAULT_THRESHOLD;
  return clampUnit(value);
}
export function sanitizeDitherMode(value: RasterGlyphDitherMode | undefined): RasterGlyphDitherMode {
  return value === 'ordered' ? 'ordered' : 'none';
}
export function byteAt(data: Uint8ClampedArray | readonly number[], index: number): number {
  const value = data[index];
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(255, Math.round(value)));
}
export function clampUnit(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}
export function clampRange(value: number, min: number, max: number): number {
  if (value <= min) return min;
  if (value >= max) return max;
  return value;
}
