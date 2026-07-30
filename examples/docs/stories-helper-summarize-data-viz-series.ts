import type { DataVizSeriesSummary } from './stories-helper-data-viz-series-summary.js';

export function summarizeDataVizSeries(values: readonly number[]): DataVizSeriesSummary {
  const safeValues = values.map((value) => Number.isFinite(value) ? value : 0);
  const [first, ...rest] = safeValues;
  if (first === undefined) {
    return { count: 0, first: 0, last: 0, min: 0, max: 0, trend: 'flat' };
  }

  let last = first;
  let min = first;
  let max = first;
  let rises = 0;
  let falls = 0;
  let previous = first;

  for (const current of rest) {
    if (current > previous) rises++;
    else if (current < previous) falls++;
    if (current < min) min = current;
    if (current > max) max = current;
    previous = current;
    last = current;
  }

  const range = max - min;
  const trend = rises === 0 && falls === 0
    ? 'flat'
    : rises === 0
      ? 'falling'
      : falls === 0
        ? 'rising'
        : Math.abs(last - first) <= Math.max(1, range * 0.2)
          ? 'mixed'
          : last > first ? 'rising with dips' : 'falling with rebounds';

  return { count: safeValues.length, first, last, min, max, trend };
}
