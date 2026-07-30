import type { Surface } from '@flyingrobots/bijou';
import {
  createFocusAreaStateForSurface,
  focusAreaScrollTo,
  focusAreaScrollToX,
  focusAreaSurfaceInto,
} from './focus-area.js';
import { isMinimized } from './panel-state.js';
import type { RenderContext } from './app-frame-types.js';
import type { LayoutRect } from './layout-rect.js';
import type {
  FramePaneNode,
  PaintedFrameNodeResult,
} from './app-frame-render-contract.js';
import {
  getFramePaneScratch,
  type FramePaneScratchPool,
} from './app-frame-render-scratch.js';
import {
  applySurfaceBackground,
  blockSurface,
  framePaneOutputToSurface,
} from './app-frame-render-surface.js';

export function paintFramePane<PageModel, Msg>(
  node: FramePaneNode,
  localRect: LayoutRect,
  absoluteRect: LayoutRect,
  ctx: RenderContext<PageModel, Msg>,
  target: Surface,
  scratchPool: FramePaneScratchPool,
): PaintedFrameNodeResult {
  if (isMinimized(ctx.visibility, node.paneId)) {
    target.blit(
      applySurfaceBackground(
        blockSurface(
          `[${node.paneId}] \u25b8`,
          localRect.width,
          localRect.height,
        ),
        ctx.frameBackgroundToken,
      ),
      localRect.col,
      localRect.row,
    );
    return geometry(node.paneId, absoluteRect);
  }
  const prior = ctx.scrollByPane[node.paneId] ?? { x: 0, y: 0 };
  const content = framePaneOutputToSurface(
    node.render(localRect.width, localRect.height),
    localRect.width,
    localRect.height,
    getFramePaneScratch(scratchPool, localRect.width, localRect.height),
  );
  applySurfaceBackground(content, ctx.frameBackgroundToken);
  let state = createFocusAreaStateForSurface(content, {
    width: localRect.width,
    height: localRect.height,
    overflowX: node.overflowX ?? 'hidden',
  });
  state = focusAreaScrollTo(state, prior.y);
  state = focusAreaScrollToX(state, prior.x);
  focusAreaSurfaceInto(
    content,
    state,
    target,
    {
      focused: node.paneId === ctx.focusedPaneId,
      ctx: ctx.ctx,
      id: node.paneId,
      classes: [node.paneId === ctx.focusedPaneId ? 'focused' : 'unfocused'],
      focusedGutterToken: node.focusedGutterToken,
      unfocusedGutterToken: node.unfocusedGutterToken,
    },
    localRect.col,
    localRect.row,
  );
  return geometry(node.paneId, absoluteRect);
}

function geometry(paneId: string, rect: LayoutRect): PaintedFrameNodeResult {
  return {
    paneRects: new Map([[paneId, rect]]),
    paneOrder: [paneId],
  };
}
