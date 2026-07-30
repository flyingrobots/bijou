import type { DataVizMetricEntry } from './stories-helper-data-viz-metric-entry.js';
import { formatPerfValue } from './stories-helper-format-perf-value.js';

export function perfOverlayEntries(stats: {
  readonly fps: number;
  readonly frameTimeMs: number;
  readonly frameTimeHistory?: readonly number[];
  readonly width: number;
  readonly height: number;
  readonly heapUsedMB?: number;
  readonly rssMB?: number;
}): DataVizMetricEntry[] {
  const entries: DataVizMetricEntry[] = [
    { label: 'FPS', value: String(Math.round(stats.fps)) },
    { label: 'frame', value: `${formatPerfValue(stats.frameTimeMs, 2)} ms`, sparkline: stats.frameTimeHistory },
    { label: 'size', value: `${String(stats.width)}×${String(stats.height)}` },
  ];

  if (stats.heapUsedMB != null) {
    entries.push({ label: 'heap', value: `${formatPerfValue(stats.heapUsedMB, 1)} MB` });
  }
  if (stats.rssMB != null) {
    entries.push({ label: 'rss', value: `${formatPerfValue(stats.rssMB, 1)} MB` });
  }

  return entries;
}
