import type { Cell } from '@flyingrobots/bijou';

import type { ColorAccumulator, RasterGlyphColorMode, RasterSample, RgbaFrame } from './raster-glyph.part01.js';

import { byteAt } from './raster-glyph.part07.js';
export function cellForAccumulatedColors(
  char: string,
  colorMode: RasterGlyphColorMode,
  colors: ColorAccumulator,
  darkColors: ColorAccumulator,
  lightColors: ColorAccumulator,
): Cell {
  if (colorMode === 'none') return { char, empty: false };
  if (colorMode === 'fg') return colorCell(char, averagedColor(colors), undefined);
  return colorCell(char, averagedColor(darkColors), averagedColor(lightColors));
}
export function colorCell(
  char: string,
  fgRGB: readonly [number, number, number] | undefined,
  bgRGB: readonly [number, number, number] | undefined,
): Cell {
  const cell: Cell = { char, empty: false };
  if (fgRGB !== undefined) cell.fgRGB = fgRGB;
  if (bgRGB !== undefined) cell.bgRGB = bgRGB;
  return cell;
}
export function accumulateSampleColors(
  sample: RasterSample | undefined,
  colors: ColorAccumulator,
  darkColors: ColorAccumulator,
  lightColors: ColorAccumulator,
  threshold: number,
): void {
  if (sample?.color === undefined) return;

  accumulateColor(colors, sample.color[0], sample.color[1], sample.color[2]);
  if (sample.darkness >= threshold) {
    accumulateColor(darkColors, sample.color[0], sample.color[1], sample.color[2]);
  } else {
    accumulateColor(lightColors, sample.color[0], sample.color[1], sample.color[2]);
  }
}
export function readPixel(frame: RgbaFrame, x: number, y: number): {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly alpha: number;
  readonly darkness: number;
} {
  const offset = ((y * frame.width) + x) * 4;
  const r = byteAt(frame.data, offset);
  const g = byteAt(frame.data, offset + 1);
  const b = byteAt(frame.data, offset + 2);
  const alpha = byteAt(frame.data, offset + 3) / 255;
  const luma = ((0.2126 * r) + (0.7152 * g) + (0.0722 * b)) / 255;
  const brightness = ((1 - alpha) * 1) + (alpha * luma);
  return {
    r,
    g,
    b,
    alpha,
    darkness: 1 - brightness,
  };
}
export function createColorAccumulator(): ColorAccumulator {
  return { r: 0, g: 0, b: 0, count: 0 };
}
export function accumulateColor(accumulator: ColorAccumulator, r: number, g: number, b: number): void {
  accumulator.r += r;
  accumulator.g += g;
  accumulator.b += b;
  accumulator.count++;
}
export function averagedColor(accumulator: ColorAccumulator): readonly [number, number, number] | undefined {
  if (accumulator.count === 0) return undefined;
  return [
    Math.round(accumulator.r / accumulator.count),
    Math.round(accumulator.g / accumulator.count),
    Math.round(accumulator.b / accumulator.count),
  ];
}
export function validateRgbaFrame(frame: RgbaFrame): void {
  const width = sanitizeDimension(frame.width);
  const height = sanitizeDimension(frame.height);
  if (width <= 0 || height <= 0) {
    throw new RangeError('RGBA frame width and height must be positive integers.');
  }
  const requiredLength = width * height * 4;
  if (frame.data.length < requiredLength) {
    throw new RangeError(`RGBA frame data must contain at least ${String(requiredLength)} values.`);
  }
}
export function sanitizeDimension(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.floor(value);
}
