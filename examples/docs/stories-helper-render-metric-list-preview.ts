import type { BijouContext, Surface } from './stories-runtime.js';
import type { DataVizMetricEntry } from './stories-helper-data-viz-metric-entry.js';
import { dataVizSummarySurface } from './stories-helper-data-viz-summary-surface.js';
import { formatDataVizNumber } from './stories-helper-format-data-viz-number.js';
import { summarizeDataVizSeries } from './stories-helper-summarize-data-viz-series.js';

export function renderMetricListPreview(
  title: string,
  entries: readonly DataVizMetricEntry[],
  ctx: BijouContext,
  width: number,
): Surface {
  if (ctx.mode === 'pipe') {
    return dataVizSummarySurface(width, [
      title,
      ...entries.map((entry) => {
        if (entry.sparkline == null || entry.sparkline.length === 0) {
          return `${entry.label}: ${entry.value}`;
        }
        const summary = summarizeDataVizSeries(entry.sparkline);
        return `${entry.label}: ${entry.value} (${formatDataVizNumber(summary.min)}-${formatDataVizNumber(summary.max)}, ${summary.trend})`;
      }),
    ]);
  }

  return dataVizSummarySurface(width, [
    `${title} metrics.`,
    ...entries.map((entry) => {
      if (entry.sparkline == null || entry.sparkline.length === 0) {
        return `${entry.label}: ${entry.value}.`;
      }
      const summary = summarizeDataVizSeries(entry.sparkline);
      return `${entry.label}: ${entry.value}. Trend ${formatDataVizNumber(summary.min)}-${formatDataVizNumber(summary.max)}, ${summary.trend}.`;
    }),
  ]);
}
