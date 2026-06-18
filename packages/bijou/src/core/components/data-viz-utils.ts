/**
 * Shared math utilities for data-visualization components.
 *
 * Used by sparkline, brailleChartSurface, and their dependents.
 */

/**
 * Filter non-finite values (NaN, Infinity, -Infinity) from a numeric array,
 * replacing them with 0. Returns the original array unchanged if all values
 * are finite.
 */
export function sanitizeValues(values: readonly number[]): readonly number[] {
  for (const value of values) {
    if (!Number.isFinite(value)) {
      return values.map((v) => Number.isFinite(v) ? v : 0);
    }
  }
  return values;
}

/** Stack-safe minimum of a numeric array. Returns `Infinity` for empty arrays. */
export function safeMin(values: readonly number[]): number {
  let min = Infinity;
  for (const value of values) {
    if (value < min) min = value;
  }
  return min;
}

/** Stack-safe maximum of a numeric array. Returns `-Infinity` for empty arrays. */
export function safeMax(values: readonly number[]): number {
  let max = -Infinity;
  for (const value of values) {
    if (value > max) max = value;
  }
  return max;
}

/**
 * Sample `values` into `count` buckets. When the data array is longer
 * than the target count, each bucket averages the values that fall into
 * it (using exclusive upper bounds to avoid double-counting). When
 * shorter, values are stretched via nearest-neighbor sampling.
 *
 * Returns an empty array when `count <= 0`.
 */
export function sampleToWidth(values: readonly number[], count: number): number[] {
  if (count <= 0) return [];
  if (values.length === 0) return new Array<number>(count).fill(0);
  if (values.length === count) return [...values];

  const out: number[] = [];
  const ratio = values.length / count;
  for (let i = 0; i < count; i++) {
    const lo = Math.floor(i * ratio);
    const hi = Math.min(values.length, Math.ceil((i + 1) * ratio));
    if (hi - lo <= 1) {
      out.push(valueAt(values, lo));
    } else {
      let sum = 0;
      for (let j = lo; j < hi; j++) {
        sum += valueAt(values, j);
      }
      out.push(sum / (hi - lo));
    }
  }
  return out;
}

function valueAt(values: readonly number[], index: number): number {
  return values[index] ?? 0;
}
