import type { LayoutRect } from './layout-rect.js';
import type { SplitPaneLayout, SplitPaneOptions, SplitPaneState } from './split-pane.part01.js';
import { splitPaneLayout } from './split-pane.part02.js';

/**
 * Mirror a row split's rectangles across its own width.
 *
 * Pane sizes and the divider size are kept exactly; only their columns move,
 * so pane A (the logical start) lands on the right edge and pane B on the left.
 * The three rectangles tile the same extent as the unmirrored layout.
 */
export function mirrorSplitPaneLayout(layout: SplitPaneLayout): SplitPaneLayout {
  const extent = layout.paneB.col + layout.paneB.width;
  const flip = (rect: LayoutRect): LayoutRect => ({
    ...rect,
    col: extent - rect.col - rect.width,
  });
  return {
    paneA: flip(layout.paneA),
    divider: flip(layout.divider),
    paneB: flip(layout.paneB),
  };
}

/**
 * The one placement of a split's rectangles for a resolved inline direction.
 *
 * `mirrored` is the caller's `mirrorsLayout()` answer. Only `row` splits
 * mirror; `column` (top and bottom) splits never do. The ratio stays the
 * logical share of pane A in both directions, so pane sizes never change.
 */
export function placeSplitPaneLayout(
  state: SplitPaneState,
  options: Omit<SplitPaneOptions, 'paneA' | 'paneB'>,
  mirrored: boolean,
): SplitPaneLayout {
  const layout = splitPaneLayout(state, options);
  if (!mirrored || (options.direction ?? 'row') !== 'row') return layout;
  return mirrorSplitPaneLayout(layout);
}
