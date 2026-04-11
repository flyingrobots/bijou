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
  let needsCopy = false;
  for (let i = 0; i < values.length; i++) {
    if (!Number.isFinite(values[i])) { needsCopy = true; break; }
  }
  if (!needsCopy) return values;
  return values.map((v) => Number.isFinite(v) ? v : 0);
}

/** Stack-safe minimum of a numeric array. Returns `Infinity` for empty arrays. */
export function safeMin(values: readonly number[]): number {
  let min = Infinity;
  for (let i = 0; i < values.length; i++) {
    if (values[i]! < min) min = values[i]!;
  }
  return min;
}

/** Stack-safe maximum of a numeric array. Returns `-Infinity` for empty arrays. */
export function safeMax(values: readonly number[]): number {
  let max = -Infinity;
  for (let i = 0; i < values.length; i++) {
    if (values[i]! > max) max = values[i]!;
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
  if (values.length === 0) return new Array<number>(count).fill(0);
  if (values.length === count) return [...values];

  const out: number[] = [];
  const ratio = values.length / count;
  for (let i = 0; i < count; i++) {
    const lo = Math.floor(i * ratio);
    const hi = Math.min(values.length, Math.ceil((i + 1) * ratio));
    if (hi - lo <= 1) {
      out.push(values[lo]!);
    } else {
      let sum = 0;
      for (let j = lo; j < hi; j++) {
        sum += values[j]!;
      }
      out.push(sum / (hi - lo));
    }
  }
  return out;
}
