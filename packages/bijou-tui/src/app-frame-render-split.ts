import type { Surface } from '@flyingrobots/bijou';
import { isPaneMinimized } from './app-frame-utils.js';
import type {
  FrameSplitNode,
  PaintFrameNode,
  PaintedFrameNodeResult,
} from './app-frame-render-contract.js';
import type { FramePaneScratchPool } from './app-frame-render-scratch.js';
import { paintDivider } from './app-frame-render-surface.js';
import type { RenderContext } from './app-frame-types.js';
import type { LayoutRect } from './layout-rect.js';
import { getNodeId, resolveChildOrder } from './panel-dock.js';
import { splitPaneLayout } from './split-pane.js';
import { mergeMaps, offsetRect } from './app-frame-utils.js';

export function paintFrameSplit<PageModel, Msg>(
  node: FrameSplitNode,
  localRect: LayoutRect,
  absoluteRect: LayoutRect,
  ctx: RenderContext<PageModel, Msg>,
  target: Surface,
  scratchPool: FramePaneScratchPool,
  paintNode: PaintFrameNode,
): PaintedFrameNodeResult {
  const direction = node.direction ?? 'row';
  const defaultIds = [getNodeId(node.paneA), getNodeId(node.paneB)];
  const order = resolveChildOrder(ctx.dockState, node.splitId, defaultIds);
  const swapped = order[0] !== defaultIds[0];
  const paneA = swapped ? node.paneB : node.paneA;
  const paneB = swapped ? node.paneA : node.paneB;
  const aMinimized = isPaneMinimized(paneA, ctx.visibility);
  const bMinimized = isPaneMinimized(paneB, ctx.visibility);
  let splitState = node.state;
  const ratio = ctx.model.splitRatioOverrides[ctx.pageId]?.[node.splitId];
  if (ratio !== undefined) splitState = { ...splitState, ratio };
  const mainAxis = direction === 'row' ? localRect.width : localRect.height;
  const minimizedRatio = Math.min(1, mainAxis) / Math.max(1, mainAxis);
  if (aMinimized && !bMinimized) {
    splitState = { ...splitState, ratio: minimizedRatio };
  } else if (bMinimized && !aMinimized) {
    splitState = { ...splitState, ratio: 1 - minimizedRatio };
  }
  const layout = splitPaneLayout(splitState, {
    direction,
    width: localRect.width,
    height: localRect.height,
    minA: node.minA,
    minB: node.minB,
  });
  const localA = offsetRect(layout.paneA, localRect.row, localRect.col);
  const localB = offsetRect(layout.paneB, localRect.row, localRect.col);
  const absoluteA = offsetRect(
    layout.paneA,
    absoluteRect.row,
    absoluteRect.col,
  );
  const absoluteB = offsetRect(
    layout.paneB,
    absoluteRect.row,
    absoluteRect.col,
  );
  const renderedA = paintNode(
    paneA,
    localA,
    absoluteA,
    ctx,
    target,
    scratchPool,
  );
  const renderedB = paintNode(
    paneB,
    localB,
    absoluteB,
    ctx,
    target,
    scratchPool,
  );
  paintDivider(
    target,
    offsetRect(layout.divider, localRect.row, localRect.col),
    node.dividerChar,
    direction,
  );
  return {
    paneRects: mergeMaps(renderedA.paneRects, renderedB.paneRects),
    paneOrder: [...renderedA.paneOrder, ...renderedB.paneOrder],
  };
}
