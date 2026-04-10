/**
 * Braille area chart — high-density filled chart using Unicode Braille.
 *
 * Each terminal cell contains a 2×4 dot grid (8 dots per Braille character,
 * starting at U+2800). This gives 2× horizontal and 4× vertical sub-pixel
 * resolution compared to regular characters.
 *
 * The chart renders a filled area from the bottom up — dots below the
 * data line are "on", dots above are "off".
 *
 * @example
 * ```ts
 * const chart = brailleChartSurface([1, 4, 2, 8, 3, 7, 5], {
 *   width: 20,
 *   height: 6,
 *   ctx,
 * });
 * ```
 */

import { createSurface, type Surface } from '../../ports/surface.js';
import { resolveSafeCtx as resolveCtx } from '../resolve-ctx.js';
import { tokenToCellStyle } from './surface-text.js';
import type { BijouNodeOptions } from './types.js';
import type { TokenValue } from '../../core/theme/tokens.js';

export interface BrailleChartOptions extends BijouNodeOptions {
  /** Chart width in terminal columns. Required. */
  readonly width: number;
  /** Chart height in terminal rows. Required. */
  readonly height: number;
  /** Explicit minimum value for scaling. Defaults to `Math.min(...values)`. */
  readonly min?: number;
  /** Explicit maximum value for scaling. Defaults to `Math.max(...values)`. */
  readonly max?: number;
  /** Foreground token for the chart dots. */
  readonly fgToken?: TokenValue;
  /** Background token applied to the surface. */
  readonly bgToken?: TokenValue;
}

// Braille dot positions within U+2800 encoding:
//   col 0  col 1
//   bit 0  bit 3   row 0 (top)
//   bit 1  bit 4   row 1
//   bit 2  bit 5   row 2
//   bit 6  bit 7   row 3 (bottom)
const DOT_BITS = [
  [0x01, 0x08], // row 0
  [0x02, 0x10], // row 1
  [0x04, 0x20], // row 2
  [0x40, 0x80], // row 3
] as const;

/**
 * Sample values into `count` buckets, averaging where needed.
 */
function sampleValues(values: readonly number[], count: number): number[] {
  if (values.length === 0) return new Array<number>(count).fill(0);
  if (values.length === count) return [...values];

  const out: number[] = [];
  const ratio = values.length / count;
  for (let i = 0; i < count; i++) {
    const lo = Math.floor(i * ratio);
    const hi = Math.min(values.length - 1, Math.floor((i + 1) * ratio));
    if (lo === hi) {
      out.push(values[lo]!);
    } else {
      let sum = 0;
      let n = 0;
      for (let j = lo; j <= hi; j++) {
        sum += values[j]!;
        n++;
      }
      out.push(sum / n);
    }
  }
  return out;
}

/**
 * Render a filled area chart using Unicode Braille characters.
 *
 * Values are sampled to fit `width * 2` horizontal sub-pixels and
 * normalized to `height * 4` vertical sub-pixels. Dots below the
 * data line are filled; dots above are empty.
 */
export function brailleChartSurface(
  values: readonly number[],
  options: BrailleChartOptions,
): Surface {
  const { width, height } = options;
  const ctx = resolveCtx(options.ctx);

  const surface = createSurface(width, height);
  if (width <= 0 || height <= 0 || values.length === 0) return surface;

  // Each cell is 2 dots wide, so we have width*2 horizontal sample points.
  const subCols = width * 2;
  const subRows = height * 4;
  const sampled = sampleValues(values, subCols);

  const min = options.min ?? Math.min(...sampled);
  const max = options.max ?? Math.max(...sampled);
  const range = max - min;

  // Normalize values to sub-pixel row heights (0 = bottom, subRows = top).
  const heights = sampled.map((v) => {
    const normalized = range === 0 ? 0.5 : (v - min) / range;
    return Math.round(normalized * (subRows - 1));
  });

  // Resolve styling.
  const fgStyle = tokenToCellStyle(options.fgToken ?? ctx?.semantic('info'));
  const bgStyle = tokenToCellStyle(options.bgToken);

  // Build braille characters cell by cell.
  for (let cy = 0; cy < height; cy++) {
    for (let cx = 0; cx < width; cx++) {
      let bits = 0;

      for (let dotRow = 0; dotRow < 4; dotRow++) {
        // subRow 0 = top of surface, subRows-1 = bottom.
        // cy=0 is the top row on screen, so its sub-rows are the highest values.
        const subRow = cy * 4 + dotRow;
        // Invert: sub-row 0 is the top of the chart (highest value).
        const threshold = subRows - 1 - subRow;

        for (let dotCol = 0; dotCol < 2; dotCol++) {
          const sampleIdx = cx * 2 + dotCol;
          if (sampleIdx < heights.length && heights[sampleIdx]! >= threshold) {
            bits |= DOT_BITS[dotRow]![dotCol]!;
          }
        }
      }

      const ch = String.fromCharCode(0x2800 + bits);
      surface.set(cx, cy, {
        char: ch,
        fg: fgStyle.fg,
        bg: bgStyle.bg ?? fgStyle.bg,
        modifiers: fgStyle.modifiers,
        empty: false,
      });
    }
  }

  return surface;
}
