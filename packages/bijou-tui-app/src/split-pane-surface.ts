import { createSurface, separatorSurface, type BijouContext, type Surface } from '@flyingrobots/bijou';
import { clipToWidth } from '@flyingrobots/bijou-tui';

/**
 * Render a surface-native label on the first row of a scaffold split pane.
 */
export function renderSplitPaneLabelSurface(
  label: string,
  width: number,
  height: number,
  ctx: BijouContext,
): Surface | string {
  if (width <= 0 || height <= 0) return '';

  const surface = createSurface(width, height);
  surface.blit(separatorSurface({
    label: clipToWidth(label, width),
    width,
    ctx,
  }), 0, 0);
  return surface;
}
