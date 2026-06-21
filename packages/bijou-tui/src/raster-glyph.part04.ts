import { BAYER_4X4, ORDERED_DITHER_STRENGTH } from './raster-glyph.part01.js';

import type { FitTransform, RasterGlyphAdjustments, RasterGlyphFit, RasterSample, RgbaFrame } from './raster-glyph.part01.js';

import { clampRange, clampUnit } from './raster-glyph.part07.js';
export function adjustSample(
  sample: RasterSample | undefined,
  x: number,
  y: number,
  adjustments: RasterGlyphAdjustments,
): RasterSample | undefined {
  if (sample === undefined) return undefined;
  return {
    ...sample,
    darkness: adjustedDarkness(sample.darkness, x, y, adjustments),
  };
}
export function adjustedDarkness(
  darkness: number,
  x: number,
  y: number,
  adjustments: RasterGlyphAdjustments,
): number {
  let next = ((darkness - 0.5) * adjustments.contrast) + 0.5;
  if (adjustments.dither === 'ordered') {
    next += orderedDitherOffset(x, y);
  }
  return clampUnit(next);
}
export function orderedDitherOffset(x: number, y: number): number {
  const row = BAYER_4X4[Math.abs(Math.floor(y)) % BAYER_4X4.length];
  const value = row?.[Math.abs(Math.floor(x)) % row.length] ?? 0;
  return ((value - 7.5) / 16) * ORDERED_DITHER_STRENGTH;
}
export function createFitTransform(
  frame: RgbaFrame,
  columns: number,
  rows: number,
  fit: RasterGlyphFit,
  cellAspectRatio: number,
  zoom: number,
  panX: number,
  panY: number,
): FitTransform {
  if (fit === 'stretch') {
    const drawWidth = columns * zoom;
    const drawHeight = rows * zoom;
    return {
      scaleX: drawWidth / frame.width,
      scaleY: drawHeight / frame.height,
      offsetX: clampDrawOffset(((columns - drawWidth) / 2) + panX, columns, drawWidth),
      offsetY: clampDrawOffset(((rows - drawHeight) / 2) + panY, rows, drawHeight),
      drawWidth,
      drawHeight,
    };
  }

  const visualTargetWidth = columns * cellAspectRatio;
  const scaleX = visualTargetWidth / frame.width;
  const scaleY = rows / frame.height;
  const baseScale = fit === 'contain'
    ? Math.min(scaleX, scaleY)
    : Math.max(scaleX, scaleY);
  const scale = baseScale * zoom;
  const drawWidth = (frame.width * scale) / cellAspectRatio;
  const drawHeight = frame.height * scale;

  return {
    scaleX: scale / cellAspectRatio,
    scaleY: scale,
    offsetX: clampDrawOffset(((columns - drawWidth) / 2) + panX, columns, drawWidth),
    offsetY: clampDrawOffset(((rows - drawHeight) / 2) + panY, rows, drawHeight),
    drawWidth,
    drawHeight,
  };
}
export function clampDrawOffset(offset: number, targetSize: number, drawSize: number): number {
  if (drawSize <= targetSize) return (targetSize - drawSize) / 2;
  return clampRange(offset, targetSize - drawSize, 0);
}
