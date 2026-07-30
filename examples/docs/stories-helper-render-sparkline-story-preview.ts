import { sparkline } from './stories-runtime.js';
import type { BijouContext, Surface } from './stories-runtime.js';
import { compactDataVizValues } from './stories-helper-compact-data-viz-values.js';
import { dataVizSummarySurface } from './stories-helper-data-viz-summary-surface.js';
import { formatDataVizNumber } from './stories-helper-format-data-viz-number.js';
import { summarizeDataVizSeries } from './stories-helper-summarize-data-viz-series.js';

export function renderSparklineStoryPreview(
  values: readonly number[],
  options: { readonly width?: number; readonly min?: number; readonly max?: number },
  ctx: BijouContext,
  width: number,
): string | Surface {
  if (ctx.mode === 'interactive' || ctx.mode === 'static') {
    return sparkline(values, { ...options, ctx });
  }

  const summary = summarizeDataVizSeries(values);
  if (ctx.mode === 'pipe') {
    return dataVizSummarySurface(width, [
      `samples: ${String(summary.count)}`,
      `range: ${formatDataVizNumber(summary.min)} to ${formatDataVizNumber(summary.max)}`,
      `latest: ${formatDataVizNumber(summary.last)} (${summary.trend})`,
      `values: ${compactDataVizValues(values)}`,
    ]);
  }

  return dataVizSummarySurface(width, [
    `${String(summary.count)} samples.`,
    `Started at ${formatDataVizNumber(summary.first)} and ended at ${formatDataVizNumber(summary.last)}.`,
    `Range ${formatDataVizNumber(summary.min)} to ${formatDataVizNumber(summary.max)}; latest ${formatDataVizNumber(summary.last)}.`,
    `Overall ${summary.trend} trend.`,
  ]);
}
