import { perfOverlaySurface } from './stories-runtime.js';
import type { BijouContext, Surface } from './stories-runtime.js';
import { perfOverlayEntries } from './stories-helper-perf-overlay-entries.js';
import { renderMetricListPreview } from './stories-helper-render-metric-list-preview.js';

export function renderPerfOverlayStoryPreview(
  stats: {
    readonly fps: number;
    readonly frameTimeMs: number;
    readonly frameTimeHistory?: readonly number[];
    readonly width: number;
    readonly height: number;
    readonly heapUsedMB?: number;
    readonly rssMB?: number;
  },
  options: { readonly title?: string; readonly showChart?: boolean },
  ctx: BijouContext,
  width: number,
): Surface {
  if (ctx.mode === 'interactive' || ctx.mode === 'static') {
    return perfOverlaySurface(stats, { ...options, ctx });
  }

  return renderMetricListPreview(options.title ?? 'Perf', perfOverlayEntries(stats), ctx, width);
}
