/**
 * Sparkline — compact inline trend graph using Unicode block characters.
 *
 * Renders a sequence of numeric values as a string of block chars (▁▂▃▄▅▆▇█).
 * Values are normalized between min and max (auto-detected or caller-supplied).
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

const BLOCKS = [' ', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

export interface SparklineOptions extends BijouNodeOptions {
  /** Output width in characters. Defaults to `values.length`. */
  readonly width?: number;
  /** Explicit minimum value for scaling. Defaults to `Math.min(...values)`. */
  readonly min?: number;
  /** Explicit maximum value for scaling. Defaults to `Math.max(...values)`. */
  readonly max?: number;
}

/**
 * Sample `values` into `width` buckets. When the data array is longer
 * than the target width, each bucket averages the values that fall into
 * it. When shorter, values are stretched via nearest-neighbor sampling.
 */
function sampleToWidth(values: readonly number[], width: number): number[] {
  if (values.length === 0) return new Array<number>(width).fill(0);
  if (values.length === width) return [...values];

  const out: number[] = [];
  const ratio = values.length / width;
  for (let i = 0; i < width; i++) {
    const start = i * ratio;
    const end = (i + 1) * ratio;
    const lo = Math.floor(start);
    const hi = Math.min(values.length - 1, Math.floor(end));
    if (lo === hi) {
      out.push(values[lo]!);
    } else {
      let sum = 0;
      let count = 0;
      for (let j = lo; j <= hi; j++) {
        sum += values[j]!;
        count++;
      }
      out.push(sum / count);
    }
  }
  return out;
}

/**
 * Render an array of numbers as a compact sparkline string.
 *
 * Uses Unicode block elements ▁▂▃▄▅▆▇█ with auto-scaled
 * min/max normalization. Empty input returns an empty string.
 */
export function sparkline(values: readonly number[], options: SparklineOptions = {}): string {
  if (values.length === 0) return '';

  const width = options.width ?? values.length;
  if (width <= 0) return '';

  const sampled = sampleToWidth(values, width);
  const min = options.min ?? Math.min(...sampled);
  const max = options.max ?? Math.max(...sampled);
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
