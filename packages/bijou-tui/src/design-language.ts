/**
 * Shared design-language defaults for terminal-first layout and overlays.
 *
 * These values are intentionally small and cell-based. They are not meant to
 * replace component-specific options, but to keep the default spacing and
 * overlay behavior consistent across the TUI layer.
 */

/** Shared spacing and inset defaults for the TUI layer. */
export const TUI_SPACING = {
  /** Smallest layout unit in a character grid. */
  cell: 1,
  /** Preferred structural rhythm for sections and outer spacing. */
  rhythm: 2,
  /** Tight inline gap used inside compact controls. */
  inlineGap: 1,
  /** Preferred edge inset for roomy overlays. */
  overlayMargin: 2,
  /** Minimum edge inset for compact viewports. */
  compactOverlayMargin: 1,
  /** Default gap between stacked transient notifications. */
  notificationGap: 1,
} as const;

/** Width below which the viewport should be treated as compact. */
export const COMPACT_VIEWPORT_WIDTH = 52;

/** Height below which the viewport should be treated as compact. */
export const COMPACT_VIEWPORT_HEIGHT = 16;

function normalizeNonNegativeInt(value: number | undefined, fallback: number): number {
  return sanitizeNonNegativeInt(value, fallback);
}

/**
 * Decide whether a viewport should use compact overlay/layout defaults.
 */
export function isCompactViewport(width: number, height: number): boolean {
  return sanitizeNonNegativeInt(width, 0) < COMPACT_VIEWPORT_WIDTH
    || sanitizeNonNegativeInt(height, 0) < COMPACT_VIEWPORT_HEIGHT;
}

/**
 * Resolve the default edge inset for overlays and overlay-like UI.
 *
 * Explicit user values always win. Otherwise Bijou prefers a 2-cell margin on
 * roomy screens and falls back to 1 cell on compact terminals/split panes.
 */
export function resolveOverlayMargin(
  width: number,
  height: number,
  margin?: number,
): number {
  return normalizeNonNegativeInt(
    margin,
    isCompactViewport(width, height)
      ? TUI_SPACING.compactOverlayMargin
      : TUI_SPACING.overlayMargin,
  );
}

/**
 * Resolve the default stack gap for transient notifications.
 */
export function resolveNotificationGap(gap?: number): number {
  return normalizeNonNegativeInt(gap, TUI_SPACING.notificationGap);
}

/**
 * Center an item while respecting a preferred outer inset when possible.
 *
 * If the viewport is too small to preserve the preferred inset on both sides,
 * this falls back to ordinary clamped centering.
 */
export function clampCenteredPosition(
  totalSize: number,
  itemSize: number,
  preferredInset: number,
): number {
  const centered = Math.floor((totalSize - itemSize) / 2);
  const max = Math.max(0, totalSize - itemSize);

  if (max >= preferredInset * 2) {
    return Math.min(max - preferredInset, Math.max(preferredInset, centered));
  }

  return Math.max(0, Math.min(max, centered));
}
import { sanitizeNonNegativeInt } from '@flyingrobots/bijou';
