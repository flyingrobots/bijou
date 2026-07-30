import {
  createSurface,
  type BijouContext,
} from '@flyingrobots/bijou';
import {
  createSplitPaneState,
  type FrameLayoutNode,
} from '@flyingrobots/bijou-tui';
import type {
  SkeletonPageModel,
  SkeletonPageSpec,
} from './skeleton-contract.js';
import { drawerPaneId } from './skeleton-page.js';
import { renderSplitPaneLabelSurface } from './split-pane-surface.js';

const DEFAULT_SPLIT_RATIO = 1 / 3;

/** Build the layout tree for a built-in or consumer-owned skeleton page. */
export function layoutFor(
  spec: SkeletonPageSpec,
  ctx: BijouContext,
  model: SkeletonPageModel,
): FrameLayoutNode {
  if (spec.tab.layout != null) {
    return spec.tab.layout({ ctx, tab: spec.tab, model });
  }
  if (spec.tab.render != null) {
    const render = spec.tab.render;
    return {
      kind: 'pane',
      paneId: `${spec.tab.id}-main`,
      render: (width, height) => render(width, height, {
        ctx,
        tab: spec.tab,
        model,
      }),
    };
  }
  if (spec.kind === 'drawer') {
    return {
      kind: 'pane',
      paneId: drawerPaneId(spec.tab.id),
      render: () => createSurface(0, 0),
    };
  }
  if (spec.kind === 'split') {
    return {
      kind: 'split',
      splitId: `${spec.tab.id}-split`,
      direction: 'row',
      state: createSplitPaneState({ ratio: DEFAULT_SPLIT_RATIO }),
      paneA: {
        kind: 'pane',
        paneId: `${spec.tab.id}-left`,
        render: (width, height) => renderSplitPaneLabelSurface(
          'Primary workspace (1/3)',
          width,
          height,
          ctx,
        ),
      },
      paneB: {
        kind: 'pane',
        paneId: `${spec.tab.id}-right`,
        render: (width, height) => renderSplitPaneLabelSurface(
          'Secondary context (2/3)',
          width,
          height,
          ctx,
        ),
      },
    };
  }
  return {
    kind: 'pane',
    paneId: `${spec.tab.id}-main`,
    render: () => createSurface(0, 0),
  };
}
