import type { Surface } from '@flyingrobots/bijou';

/** The rectangle one overlay covers after composition. */
export interface OverlayRect {
  readonly col: number;
  readonly row: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Surfaces a compositor dimmed as a backdrop, each with the rectangles its overlays were then drawn over.
 *
 * Internal and deliberately not exported from the package index: it adds no field to a Surface or a Cell.
 * The component audit reads it so that a backdrop dimmed on purpose is not measured as text the reader is
 * asked to read, while anything an overlay drew is.
 */
const DIMMED_BACKDROPS = new WeakMap<Surface, readonly OverlayRect[]>();

/** Record that `target` was dimmed as a backdrop under `overlays`, or forget it when `overlays` is undefined. */
export function recordDimmedBackdrop(target: Surface, overlays: readonly OverlayRect[] | undefined): void {
  if (overlays === undefined) DIMMED_BACKDROPS.delete(target);
  else DIMMED_BACKDROPS.set(target, overlays);
}

/**
 * Whether the cell at (x, y) is dimmed backdrop: the surface was last composited with a dimmed background, the
 * cell lies outside every overlay drawn over it, and the cell still carries the `dim` the compositor gave it.
 */
export function isDimmedBackdropCell(surface: Surface, x: number, y: number): boolean {
  const overlays = DIMMED_BACKDROPS.get(surface);
  if (overlays === undefined || x < 0 || y < 0 || x >= surface.width || y >= surface.height) return false;
  if (overlays.some((o) => x >= o.col && x < o.col + o.width && y >= o.row && y < o.row + o.height)) return false;
  return (surface.get(x, y).modifiers ?? []).includes('dim');
}
