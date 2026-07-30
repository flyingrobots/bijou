import type { Surface, TokenValue } from '@flyingrobots/bijou';
import type {
  FrameGridNode,
  PaintFrameNode,
  PaintedFrameNodeResult,
} from './app-frame-render-contract.js';
import type { FramePaneScratchPool } from './app-frame-render-scratch.js';
import {
  applySurfaceBackground,
  blockSurface,
} from './app-frame-render-surface.js';
import type { RenderContext } from './app-frame-types.js';
import type { RenderResult } from './app-frame-types.js';
import { gridLayout } from './grid.js';
import type { LayoutRect } from './layout-rect.js';
import { offsetRect } from './app-frame-utils.js';

export function paintFrameGrid<PageModel, Msg>(
  node: FrameGridNode,
  localRect: LayoutRect,
  absoluteRect: LayoutRect,
  ctx: RenderContext<PageModel, Msg>,
  target: Surface,
  scratchPool: FramePaneScratchPool,
  paintNode: PaintFrameNode,
): PaintedFrameNodeResult {
  const rectangles = gridLayout({
    width: localRect.width,
    height: localRect.height,
    columns: node.columns,
    rows: node.rows,
    areas: node.areas,
    gap: node.gap,
  });
  const paneRects = new Map<string, LayoutRect>();
  const seenPaneIds = new Set<string>();
  const paneOrder: string[] = [];
  for (const [areaName, areaRect] of rectangles) {
    const localArea = offsetRect(areaRect, localRect.row, localRect.col);
    const absoluteArea = offsetRect(
      areaRect,
      absoluteRect.row,
      absoluteRect.col,
    );
    const child = node.cells[areaName];
    if (child == null) {
      ctx.ctx?.io.writeError(
        `createFramedApp: grid cell "${areaName}" missing in page "${ctx.pageId}" — rendering placeholder\n`,
      );
      target.blit(
        renderMissingGridCell(areaName, localArea, ctx.frameBackgroundToken)
          .surface,
        localArea.col,
        localArea.row,
      );
      continue;
    }
    const rendered = paintNode(
      child,
      localArea,
      absoluteArea,
      ctx,
      target,
      scratchPool,
    );
    for (const [paneId, paneRect] of rendered.paneRects) {
      if (paneRects.has(paneId)) {
        throw new Error(
          `createFramedApp: duplicate paneId "${paneId}" in rendered layout`,
        );
      }
      paneRects.set(paneId, paneRect);
    }
    for (const paneId of rendered.paneOrder) {
      if (seenPaneIds.has(paneId)) {
        throw new Error(
          `createFramedApp: duplicate paneId "${paneId}" in rendered pane order`,
        );
      }
      seenPaneIds.add(paneId);
      paneOrder.push(paneId);
    }
  }
  return { paneRects, paneOrder };
}

/** Render a placeholder for a grid area with no matching cell definition. */
export function renderMissingGridCell(
  areaName: string,
  rect: LayoutRect,
  frameBackgroundToken?: TokenValue,
): RenderResult {
  return {
    surface: applySurfaceBackground(
      blockSurface(`[missing grid cell: ${areaName}]`, rect.width, rect.height),
      frameBackgroundToken,
    ),
    paneRects: new Map(),
    paneOrder: [],
  };
}
