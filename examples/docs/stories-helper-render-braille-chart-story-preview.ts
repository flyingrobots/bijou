import { brailleChartSurface } from './stories-runtime.js';
import type { BijouContext, Surface } from './stories-runtime.js';
import { dataVizSummarySurface } from './stories-helper-data-viz-summary-surface.js';
import { formatDataVizNumber } from './stories-helper-format-data-viz-number.js';
import { summarizeDataVizSeries } from './stories-helper-summarize-data-viz-series.js';

export function renderBrailleChartStoryPreview(
  values: readonly number[],
  options: { readonly width: number; readonly height: number; readonly min?: number; readonly max?: number },
  ctx: BijouContext,
  width: number,
): Surface {
  if (ctx.mode === 'interactive' || ctx.mode === 'static') {
    return brailleChartSurface(values, { ...options, ctx });
  }

  const summary = summarizeDataVizSeries(values);
  if (ctx.mode === 'pipe') {
    return dataVizSummarySurface(width, [
      `samples: ${String(summary.count)}`,
      `range: ${formatDataVizNumber(summary.min)} to ${formatDataVizNumber(summary.max)}`,
      `peak: ${formatDataVizNumber(summary.max)}`,
      `latest: ${formatDataVizNumber(summary.last)} (${summary.trend})`,
    ]);
  }

  return dataVizSummarySurface(width, [
    `${String(summary.count)} samples.`,
    `Started at ${formatDataVizNumber(summary.first)} and ended at ${formatDataVizNumber(summary.last)}.`,
    `Range ${formatDataVizNumber(summary.min)} to ${formatDataVizNumber(summary.max)}; peak ${formatDataVizNumber(summary.max)}.`,
    `Overall ${summary.trend} area trend.`,
  ]);
}
