import type {
  LayoutNode as SurfaceLayoutNode,
} from '@flyingrobots/bijou';
import type { InternalFrameModel } from './app-frame-types.js';
import type { LayoutRect } from './layout-rect.js';

export interface FrameTabTarget {
  readonly pageId: string;
  readonly startCol: number;
  readonly endCol: number;
}

export function createShellRetainedLayoutNode(
  id: string,
  rect: LayoutRect,
  children: SurfaceLayoutNode[] = [],
): SurfaceLayoutNode {
  return {
    id,
    rect: {
      x: rect.col,
      y: rect.row,
      width: rect.width,
      height: rect.height,
    },
    children,
  };
}

export function buildWorkspaceLayoutTreeFromPaneRects<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  bodyRect: LayoutRect,
  paneRects: ReadonlyMap<string, LayoutRect>,
  tabTargets: readonly FrameTabTarget[],
): SurfaceLayoutNode {
  const tabChildren = tabTargets.map((target) =>
    createShellRetainedLayoutNode(`tab:${target.pageId}`, {
      row: 0,
      col: target.startCol,
      width: target.endCol - target.startCol + 1,
      height: 1,
    }),
  );
  const paneChildren: SurfaceLayoutNode[] = [];
  for (const [paneId, rect] of paneRects.entries()) {
    paneChildren.push(
      createShellRetainedLayoutNode(`pane:${paneId}`, rect),
    );
  }
  return createShellRetainedLayoutNode(
    'workspace',
    { row: 0, col: 0, width: model.columns, height: model.rows },
    [
      createShellRetainedLayoutNode(
        'header-bar',
        { row: 0, col: 0, width: model.columns, height: 1 },
        tabChildren,
      ),
      createShellRetainedLayoutNode(
        'workspace-body',
        bodyRect,
        paneChildren,
      ),
    ],
  );
}
