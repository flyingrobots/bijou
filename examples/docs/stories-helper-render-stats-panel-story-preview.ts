import { statsPanelSurface } from './stories-runtime.js';
import type { BijouContext, Surface } from './stories-runtime.js';
import type { DataVizMetricEntry } from './stories-helper-data-viz-metric-entry.js';
import { renderMetricListPreview } from './stories-helper-render-metric-list-preview.js';

export function renderStatsPanelStoryPreview(
  entries: readonly DataVizMetricEntry[],
  options: { readonly title?: string; readonly width: number },
  ctx: BijouContext,
  width: number,
): Surface {
  if (ctx.mode === 'interactive' || ctx.mode === 'static') {
    return statsPanelSurface(entries, { ...options, ctx });
  }

  return renderMetricListPreview(options.title ?? 'Metrics', entries, ctx, width);
}
