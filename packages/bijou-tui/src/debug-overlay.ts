import {
  perfOverlaySurface,
  type PerfOverlayOptions,
  type PerfOverlayStats,
  type Surface,
} from '@flyingrobots/bijou';
import { compositeSurface } from './overlay.js';

export type DebugOverlayAnchor = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface DebugOverlayOptions extends PerfOverlayOptions {
  /** Corner anchor for the perf overlay. Defaults to `top-right`. */
  readonly anchor?: DebugOverlayAnchor;
  /** Margin from the chosen screen edges. Defaults to `1`. */
  readonly margin?: number;
  /** Dim the background surface before compositing the overlay. Defaults to `false`. */
  readonly dimBackground?: boolean;
}

function sanitizeOverlayMargin(value: number | undefined): number {
  return Math.max(0, Math.floor(value ?? 1));
}

/**
 * Composite a perf overlay onto an existing surface.
 *
 * This is the TUI convenience wrapper around `perfOverlaySurface()`: callers
 * provide the background surface plus current perf stats, and the helper
 * anchors the overlay into a corner without requiring shell-specific plumbing.
 */
export function debugOverlay(
  background: Surface,
  stats: PerfOverlayStats,
  options: DebugOverlayOptions = {},
): Surface {
  const {
    anchor = 'top-right',
    margin,
    dimBackground = false,
    ...perfOptions
  } = options;

  const overlay = perfOverlaySurface(stats, perfOptions);
  const safeMargin = sanitizeOverlayMargin(margin);
  const row = anchor.startsWith('bottom')
    ? Math.max(0, background.height - overlay.height - safeMargin)
    : safeMargin;
  const col = anchor.endsWith('right')
    ? Math.max(0, background.width - overlay.width - safeMargin)
    : safeMargin;

  return compositeSurface(background, [{ content: '', row, col, surface: overlay }], { dim: dimBackground });
}
