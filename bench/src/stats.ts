/**
 * Statistics helpers shared by all harnesses.
 *
 * Produces mean, stddev, min, max, and percentile stats for a set of
 * numeric samples. No external dependencies. Linear-interpolated
 * percentiles to match common statistical conventions.
 */

export interface SampleStats {
  readonly count: number;
  readonly mean: number;
  readonly stddev: number;
  /** Coefficient of variation: stddev / mean. A rough signal-noise ratio. */
  readonly cov: number;
  readonly min: number;
  readonly max: number;
  readonly p50: number;
  readonly p90: number;
  readonly p99: number;
}

/** Linear-interpolated percentile of a sorted, ascending array. */
export function percentile(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) return NaN;
  if (sorted.length === 1) return sorted[0]!;
  const rank = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  if (lo === hi) return sorted[lo]!;
  const frac = rank - lo;
  return sorted[lo]! * (1 - frac) + sorted[hi]! * frac;
}

/** Compute mean, stddev, CoV, min, max, p50/p90/p99 for a set of samples. */
export function computeStats(values: readonly number[]): SampleStats {
  if (values.length === 0) {
    return { count: 0, mean: NaN, stddev: NaN, cov: NaN, min: NaN, max: NaN, p50: NaN, p90: NaN, p99: NaN };
  }
  const sorted = [...values].sort((a, b) => a - b);
  let sum = 0;
  for (const v of values) sum += v;
  const mean = sum / values.length;
  let variance = 0;
  for (const v of values) variance += (v - mean) * (v - mean);
  const stddev = values.length > 1 ? Math.sqrt(variance / (values.length - 1)) : 0;
  return {
    count: values.length,
    mean,
    stddev,
    cov: mean !== 0 ? stddev / mean : 0,
    min: sorted[0]!,
    max: sorted[sorted.length - 1]!,
    p50: percentile(sorted, 50),
    p90: percentile(sorted, 90),
    p99: percentile(sorted, 99),
  };
}

/** Format nanoseconds as a human-readable string. */
export function formatNs(ns: number): string {
  if (!Number.isFinite(ns)) return 'n/a';
  if (ns < 1000) return `${ns.toFixed(0)} ns`;
  if (ns < 1_000_000) return `${(ns / 1000).toFixed(2)} µs`;
  if (ns < 1_000_000_000) return `${(ns / 1_000_000).toFixed(2)} ms`;
  return `${(ns / 1_000_000_000).toFixed(2)} s`;
}
