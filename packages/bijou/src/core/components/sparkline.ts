/**
 * Sparkline — compact inline trend graph using Unicode block characters.
 *
 * Renders a sequence of numeric values as a string of block chars (▁▂▃▄▅▆▇█).
 * Values are normalized between min and max (auto-detected or caller-supplied).
 * Non-finite values (NaN, Infinity) are treated as 0.
 *
 * @example
 * ```ts
 * sparkline([1, 5, 3, 8, 2, 7])
 * // → '▁▅▃█▂▆'
 *
 * sparkline([10, 20, 30, 40], { width: 8 })
 * // → '▁▁▃▃▅▅▇▇'  (values interpolated to fit width)
 * ```
 */

import type { BijouNodeOptions } from './types.js';
import { safeMax, safeMin, sampleToWidth, sanitizeValues } from './data-viz-utils.js';

const BLOCKS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

export interface SparklineOptions extends BijouNodeOptions {
  /** Output width in characters. Defaults to `values.length`. */
  readonly width?: number;
  /** Explicit minimum value for scaling. Defaults to the minimum of the sampled values. */
  readonly min?: number;
  /** Explicit maximum value for scaling. Defaults to the maximum of the sampled values. */
  readonly max?: number;
}

/**
 * Render an array of numbers as a compact sparkline string.
 *
 * Uses Unicode block elements ▁▂▃▄▅▆▇█ with auto-scaled
 * min/max normalization. Empty input returns an empty string.
 */
export function sparkline(values: readonly number[], options: SparklineOptions = {}): string {
  if (values.length === 0) return '';

  const rawWidth = options.width ?? values.length;
  const width = Math.max(0, Math.floor(rawWidth));
  if (width <= 0 || !Number.isFinite(rawWidth)) return '';

  const sampled = sampleToWidth(sanitizeValues(values), width);
  const min = Number.isFinite(options.min) ? options.min! : safeMin(sampled);
  const max = Number.isFinite(options.max) ? options.max! : safeMax(sampled);
  const range = max - min;

  let result = '';
  for (let i = 0; i < sampled.length; i++) {
    const v = sampled[i]!;
    const normalized = range === 0 ? 0.5 : (v - min) / range;
    const index = Math.round(normalized * (BLOCKS.length - 1));
    result += BLOCKS[Math.max(0, Math.min(BLOCKS.length - 1, index))]!;
  }
  return result;
}
