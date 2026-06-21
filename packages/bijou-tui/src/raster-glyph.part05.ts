import type { Cell } from '@flyingrobots/bijou';

import type { FitTransform, RasterGlyphColorMode, RasterSample, RgbaFrame, SourceRect } from './raster-glyph.part01.js';

import { accumulateColor, averagedColor, colorCell, createColorAccumulator, readPixel } from './raster-glyph.part06.js';

import { clampRange } from './raster-glyph.part07.js';
export function sampleTargetRect(
  frame: RgbaFrame,
  transform: FitTransform,
  tx0: number,
  ty0: number,
  tx1: number,
  ty1: number,
): RasterSample | undefined {
  const rect = sourceRectForTargetRect(frame, transform, tx0, ty0, tx1, ty1);
  if (rect === undefined) return undefined;

  const colors = createColorAccumulator();
  let totalDarkness = 0;
  let sampleCount = 0;

  const startX = Math.max(0, Math.floor(rect.x0));
  const endX = Math.min(frame.width, Math.ceil(rect.x1));
  const startY = Math.max(0, Math.floor(rect.y0));
  const endY = Math.min(frame.height, Math.ceil(rect.y1));

  for (let py = startY; py < endY; py++) {
    for (let px = startX; px < endX; px++) {
      const centerX = px + 0.5;
      const centerY = py + 0.5;
      if (centerX < rect.x0 || centerX > rect.x1 || centerY < rect.y0 || centerY > rect.y1) {
        continue;
      }

      const pixel = readPixel(frame, px, py);
      totalDarkness += pixel.darkness;
      if (pixel.alpha > 0) {
        accumulateColor(colors, pixel.r, pixel.g, pixel.b);
      }
      sampleCount++;
    }
  }

  if (sampleCount === 0) {
    const px = Math.max(0, Math.min(frame.width - 1, Math.floor((rect.x0 + rect.x1) / 2)));
    const py = Math.max(0, Math.min(frame.height - 1, Math.floor((rect.y0 + rect.y1) / 2)));
    const pixel = readPixel(frame, px, py);
    totalDarkness = pixel.darkness;
    if (pixel.alpha > 0) {
      accumulateColor(colors, pixel.r, pixel.g, pixel.b);
    }
    sampleCount = 1;
  }

  return {
    darkness: totalDarkness / sampleCount,
    color: averagedColor(colors),
  };
}
export function sourceRectForTargetRect(
  frame: RgbaFrame,
  transform: FitTransform,
  tx0: number,
  ty0: number,
  tx1: number,
  ty1: number,
): SourceRect | undefined {
  const visibleX0 = Math.max(tx0, transform.offsetX);
  const visibleY0 = Math.max(ty0, transform.offsetY);
  const visibleX1 = Math.min(tx1, transform.offsetX + transform.drawWidth);
  const visibleY1 = Math.min(ty1, transform.offsetY + transform.drawHeight);

  if (visibleX0 >= visibleX1 || visibleY0 >= visibleY1) {
    return undefined;
  }

  const x0 = clampRange((visibleX0 - transform.offsetX) / transform.scaleX, 0, frame.width);
  const y0 = clampRange((visibleY0 - transform.offsetY) / transform.scaleY, 0, frame.height);
  const x1 = clampRange((visibleX1 - transform.offsetX) / transform.scaleX, 0, frame.width);
  const y1 = clampRange((visibleY1 - transform.offsetY) / transform.scaleY, 0, frame.height);

  if (x0 >= x1 || y0 >= y1) return undefined;
  return { x0, y0, x1, y1 };
}
export function cellForSample(
  char: string,
  sample: RasterSample | undefined,
  colorMode: RasterGlyphColorMode,
  threshold: number,
): Cell {
  if (sample === undefined) return { char: ' ', empty: false };
  if (colorMode === 'none') return { char, empty: false };
  if (colorMode === 'fg') return colorCell(char, sample.color, undefined);

  return sample.darkness >= threshold
    ? colorCell(char, sample.color, undefined)
    : colorCell(char, undefined, sample.color);
}
