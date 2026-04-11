/**
 * Perf overlay — prebuilt FPS + memory dashboard panel.
 *
 * Composes `statsPanelSurface` and `brailleChartSurface` into a
 * single Surface showing runtime performance metrics. Designed to
 * be blitted as an overlay onto any app surface.
 *
 * @example
 * ```ts
 * const overlay = perfOverlaySurface({
 *   fps: 30,
 *   frameTimeMs: 0.42,
 *   frameTimeHistory: frameTimeSamples,
 *   width: 120,
 *   height: 40,
 * }, { ctx });
 * ```
 */

import { createSurface, type Surface } from '../../ports/surface.js';
import { resolveSafeCtx as resolveCtx } from '../resolve-ctx.js';
import { brailleChartSurface } from './braille-chart.js';
import { statsPanelSurface, type StatsPanelEntry } from './stats-panel.js';
import type { BijouNodeOptions } from './types.js';
import type { TokenValue } from '../theme/tokens.js';

export interface PerfOverlayStats {
  /** Current frames per second. */
  readonly fps: number;
  /** Current frame time in milliseconds. */
  readonly frameTimeMs: number;
  /** Frame time history for sparkline/chart display. */
  readonly frameTimeHistory?: readonly number[];
  /** Terminal or pane width. */
  readonly width: number;
  /** Terminal or pane height. */
  readonly height: number;
  /** Heap memory used in MB. */
  readonly heapUsedMB?: number;
  /** Resident set size in MB. */
  readonly rssMB?: number;
  /** Additional custom entries appended to the panel. */
  readonly extras?: readonly StatsPanelEntry[];
}

export interface PerfOverlayOptions extends BijouNodeOptions {
  /** Panel title. Defaults to `'Perf'`. */
  readonly title?: string;
  /** Panel width. Defaults to 32. */
  readonly width?: number;
  /** Show a braille area chart of frame time history. Defaults to `true`. */
  readonly showChart?: boolean;
  /** Height of the braille chart in rows. Defaults to 4. */
  readonly chartHeight?: number;
  /** Border color token. */
  readonly borderToken?: TokenValue;
  /** Background color token. */
  readonly bgToken?: TokenValue;
}

function fmt(n: number, decimals: number): string {
  return Number.isFinite(n) ? n.toFixed(decimals) : '--';
}

/**
 * Render a prebuilt performance overlay as a Surface.
 *
 * Shows FPS, frame time, terminal size, and optional memory stats.
 * When `frameTimeHistory` is provided, includes a braille area chart
 * and inline sparklines.
 */
export function perfOverlaySurface(
  stats: PerfOverlayStats,
  options: PerfOverlayOptions = {},
): Surface {
  const ctx = resolveCtx(options.ctx);
  const panelWidth = options.width ?? 32;
  const title = options.title ?? 'Perf';
  const showChart = options.showChart ?? true;
  const chartHeight = options.chartHeight ?? 4;

  const entries: StatsPanelEntry[] = [
    { label: 'FPS', value: String(Math.round(stats.fps)) },
    { label: 'frame', value: fmt(stats.frameTimeMs, 2) + ' ms', sparkline: stats.frameTimeHistory },
    { label: 'size', value: `${stats.width}×${stats.height}` },
  ];

  if (stats.heapUsedMB != null) {
    entries.push({ label: 'heap', value: fmt(stats.heapUsedMB, 1) + ' MB' });
  }
  if (stats.rssMB != null) {
    entries.push({ label: 'rss', value: fmt(stats.rssMB, 1) + ' MB' });
  }
  if (stats.extras) {
    entries.push(...stats.extras);
  }

  const panel = statsPanelSurface(entries, {
    title,
    width: panelWidth,
    borderToken: options.borderToken,
    bgToken: options.bgToken,
    ctx,
  });

  // If no chart requested or no history, return just the panel.
  const history = stats.frameTimeHistory;
  if (!showChart || !history || history.length < 2) {
    return panel;
  }

  // Build the braille chart.
  const chartWidth = panelWidth - 4; // match inner box width
  const chart = brailleChartSurface(history, {
    width: chartWidth,
    height: chartHeight,
    fgToken: ctx?.semantic('info'),
    ctx,
  });

  // Compose: panel on top, chart below. The chart is intentionally outside
  // the panel box border — it renders as a "dangling" area chart beneath the
  // titled stats box, visually extending the overlay without a second border.
  const totalHeight = panel.height + chartHeight;
  const surface = createSurface(panelWidth, totalHeight);
  surface.blit(panel, 0, 0);
  surface.blit(chart, 2, panel.height); // indent by 2 to align with box padding

  return surface;
}
