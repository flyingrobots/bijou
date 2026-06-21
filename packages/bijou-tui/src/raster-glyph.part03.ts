import type { Surface } from '@flyingrobots/bijou';

import { BRAILLE_DOT_MAP } from './raster-glyph.part01.js';

import type { FitTransform, RasterGlyphAdjustments, RasterGlyphCharsetOrder, RasterGlyphColorMode, RgbaFrame } from './raster-glyph.part01.js';

import { QUAD_CHARS } from './raster-glyph.part02.js';

import { adjustSample } from './raster-glyph.part04.js';

import { sampleTargetRect } from './raster-glyph.part05.js';

import { accumulateSampleColors, cellForAccumulatedColors, createColorAccumulator } from './raster-glyph.part06.js';

import { clampUnit, sanitizeThreshold } from './raster-glyph.part07.js';
export function renderBraille(
  surface: Surface,
  frame: RgbaFrame,
  transform: FitTransform,
  thresholdValue: number | undefined,
  colorMode: RasterGlyphColorMode,
  adjustments: RasterGlyphAdjustments,
): void {
  const threshold = sanitizeThreshold(thresholdValue);

  for (let y = 0; y < surface.height; y++) {
    for (let x = 0; x < surface.width; x++) {
      let code = 0;
      const colors = createColorAccumulator();
      const darkColors = createColorAccumulator();
      const lightColors = createColorAccumulator();

      for (let sy = 0; sy < 4; sy++) {
        for (let sx = 0; sx < 2; sx++) {
          const sample = sampleTargetRect(
            frame,
            transform,
            x + (sx / 2),
            y + (sy / 4),
            x + ((sx + 1) / 2),
            y + ((sy + 1) / 4),
          );
          const adjustedSample = adjustSample(sample, (x * 2) + sx, (y * 4) + sy, adjustments);
          accumulateSampleColors(adjustedSample, colors, darkColors, lightColors, threshold);
          if ((adjustedSample?.darkness ?? -1) >= threshold) {
            code |= BRAILLE_DOT_MAP[sy]?.[sx] ?? 0;
          }
        }
      }

      const char = String.fromCharCode(0x2800 + code);
      surface.set(x, y, cellForAccumulatedColors(char, colorMode, colors, darkColors, lightColors));
    }
  }
}
export function renderQuad(
  surface: Surface,
  frame: RgbaFrame,
  transform: FitTransform,
  thresholdValue: number | undefined,
  colorMode: RasterGlyphColorMode,
  adjustments: RasterGlyphAdjustments,
): void {
  const threshold = sanitizeThreshold(thresholdValue);

  for (let y = 0; y < surface.height; y++) {
    for (let x = 0; x < surface.width; x++) {
      let mask = 0;
      const colors = createColorAccumulator();
      const darkColors = createColorAccumulator();
      const lightColors = createColorAccumulator();

      for (let sy = 0; sy < 2; sy++) {
        for (let sx = 0; sx < 2; sx++) {
          const sample = sampleTargetRect(
            frame,
            transform,
            x + (sx / 2),
            y + (sy / 2),
            x + ((sx + 1) / 2),
            y + ((sy + 1) / 2),
          );
          const adjustedSample = adjustSample(sample, (x * 2) + sx, (y * 2) + sy, adjustments);
          accumulateSampleColors(adjustedSample, colors, darkColors, lightColors, threshold);
          if (adjustedSample !== undefined && adjustedSample.darkness >= threshold) {
            mask |= 1 << (sy * 2 + sx);
          }
        }
      }

      const char = QUAD_CHARS[mask] ?? ' ';
      surface.set(x, y, cellForAccumulatedColors(char, colorMode, colors, darkColors, lightColors));
    }
  }
}
export function glyphForDarkness(
  darkness: number,
  glyphs: readonly string[],
  order: RasterGlyphCharsetOrder,
): string {
  if (glyphs.length === 1) return glyphs[0] ?? ' ';

  const t = order === 'light-to-dark' ? darkness : 1 - darkness;
  const index = Math.round(clampUnit(t) * (glyphs.length - 1));
  return glyphs[index] ?? glyphs[glyphs.length - 1] ?? ' ';
}
