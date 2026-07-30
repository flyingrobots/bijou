import { createSurface, type Surface } from '@flyingrobots/bijou';
import type { FrameLayoutNode } from './app-frame.js';
import type { PaintedFrameNodeResult } from './app-frame-render-contract.js';
import { paintFrameGrid } from './app-frame-render-grid.js';
import { paintFramePane } from './app-frame-render-pane.js';
import {
  createFramePaneScratchPool,
  type FramePaneScratchPool,
} from './app-frame-render-scratch.js';
import { paintFrameSplit } from './app-frame-render-split.js';
import type { RenderContext, RenderResult } from './app-frame-types.js';
import type { LayoutRect } from './layout-rect.js';

export function renderFrameNode<PageModel, Msg>(
  node: FrameLayoutNode,
  rect: LayoutRect,
  ctx: RenderContext<PageModel, Msg>,
): RenderResult {
  if (rect.width <= 0 || rect.height <= 0) {
    return {
      surface: createSurface(rect.width, rect.height),
      paneRects: new Map(),
      paneOrder: [],
    };
  }
  const surface = createSurface(rect.width, rect.height);
  const painted = paintFrameNodeInto(
    node,
    { row: 0, col: 0, width: rect.width, height: rect.height },
    rect,
    ctx,
    surface,
    createFramePaneScratchPool(),
  );
  return {
    surface,
    paneRects: painted.paneRects,
    paneOrder: painted.paneOrder,
  };
}

export function paintFrameNodeInto<PageModel, Msg>(
  node: FrameLayoutNode,
  localRect: LayoutRect,
  absoluteRect: LayoutRect,
  ctx: RenderContext<PageModel, Msg>,
  target: Surface,
  scratchPool: FramePaneScratchPool,
): PaintedFrameNodeResult {
  if (localRect.width <= 0 || localRect.height <= 0) {
    return { paneRects: new Map(), paneOrder: [] };
  }
  switch (node.kind) {
    case 'pane':
      return paintFramePane(
        node,
        localRect,
        absoluteRect,
        ctx,
        target,
        scratchPool,
      );
    case 'split':
      return paintFrameSplit(
        node,
        localRect,
        absoluteRect,
        ctx,
        target,
        scratchPool,
        paintFrameNodeInto,
      );
    case 'grid':
      return paintFrameGrid(
        node,
        localRect,
        absoluteRect,
        ctx,
        target,
        scratchPool,
        paintFrameNodeInto,
      );
  }
}
