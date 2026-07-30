import type {
  BijouContext,
  LayoutNode as SurfaceLayoutNode,
  Surface,
} from '@flyingrobots/bijou';
import type { CreateFramedAppOptions } from './app-frame-options.js';
import type { FramePage } from './app-frame-page-contract.js';
import type { InternalFrameModel } from './app-frame-types.js';
import type { LayoutRect } from './layout-rect.js';
import {
  createFramePaneScratchPool,
  renderMaximizedPane,
  renderPageContent,
  resolveHeaderLine,
} from './app-frame-render.js';
import { frameBodyRect } from './app-frame-utils.js';
import {
  buildWorkspaceLayoutTreeFromPaneRects,
  type FrameTabTarget,
} from './app-frame-workspace-tree.js';

export interface WorkspaceLayoutSnapshot<PageModel> {
  readonly activePageId: string;
  readonly activePageModel: PageModel;
  readonly columns: number;
  readonly rows: number;
  readonly visibilityState: unknown;
  readonly dockState: unknown;
  readonly splitRatioOverrides: unknown;
  readonly maximizedPaneId: string | undefined;
  readonly paneRects: ReadonlyMap<string, LayoutRect>;
  readonly tree: SurfaceLayoutNode;
}

export interface WorkspaceLayoutServices<PageModel, Msg> {
  remember(
    model: InternalFrameModel<PageModel, Msg>,
    paneRects: ReadonlyMap<string, LayoutRect>,
    tabTargets?: readonly FrameTabTarget[],
  ): WorkspaceLayoutSnapshot<PageModel>;
  paneRects(
    model: InternalFrameModel<PageModel, Msg>,
  ): ReadonlyMap<string, LayoutRect>;
  tree(model: InternalFrameModel<PageModel, Msg>): SurfaceLayoutNode;
}

export interface WorkspaceLayoutDependencies<PageModel, Msg> {
  readonly options: CreateFramedAppOptions<PageModel, Msg>;
  readonly pagesById: Map<string, FramePage<PageModel, Msg>>;
  readonly resolveHeaderScratch: () => Surface | undefined;
  readonly paneScratchPool: ReturnType<typeof createFramePaneScratchPool>;
  readonly resolveThemeContext: (
    shellThemeId: string | undefined,
  ) => BijouContext | undefined;
}

export function createWorkspaceLayoutServices<PageModel, Msg>(
  dependencies: WorkspaceLayoutDependencies<PageModel, Msg>,
): WorkspaceLayoutServices<PageModel, Msg> {
  const { options, pagesById, paneScratchPool } = dependencies;
  let cache: WorkspaceLayoutSnapshot<PageModel> | undefined;
  const bodyRect = (model: InternalFrameModel<PageModel, Msg>) =>
    frameBodyRect(
      model.columns,
      model.rows,
      options.bodyTopRows ?? 1,
      options.bodyBottomRows ?? 1,
    );
  const tabs = (model: InternalFrameModel<PageModel, Msg>) =>
    resolveHeaderLine(
      model,
      options,
      pagesById,
      dependencies.resolveHeaderScratch(),
      dependencies.resolveThemeContext(model.activeShellThemeId),
    ).tabTargets;
  const remember = (
    model: InternalFrameModel<PageModel, Msg>,
    paneRects: ReadonlyMap<string, LayoutRect>,
    tabTargets = tabs(model),
  ): WorkspaceLayoutSnapshot<PageModel> => {
    const activePageModel = model.pageModels[model.activePageId];
    if (activePageModel === undefined) {
      throw new Error(
        `createFramedApp: active page model "${model.activePageId}" is missing`,
      );
    }
    cache = {
      activePageId: model.activePageId,
      activePageModel,
      columns: model.columns,
      rows: model.rows,
      visibilityState: model.minimizedByPage[model.activePageId],
      dockState: model.dockStateByPage[model.activePageId],
      splitRatioOverrides: model.splitRatioOverrides,
      maximizedPaneId:
        model.maximizedPaneByPage[model.activePageId]?.maximizedPaneId,
      paneRects,
      tree: buildWorkspaceLayoutTreeFromPaneRects(
        model,
        bodyRect(model),
        paneRects,
        tabTargets,
      ),
    };
    return cache;
  };
  const matches = (model: InternalFrameModel<PageModel, Msg>) => {
    if (cache == null) return false;
    return cache.activePageId === model.activePageId &&
    cache.activePageModel === model.pageModels[model.activePageId] &&
    cache.columns === model.columns &&
    cache.rows === model.rows &&
    cache.visibilityState === model.minimizedByPage[model.activePageId] &&
    cache.dockState === model.dockStateByPage[model.activePageId] &&
    cache.splitRatioOverrides === model.splitRatioOverrides &&
      cache.maximizedPaneId ===
        model.maximizedPaneByPage[model.activePageId]?.maximizedPaneId;
  };
  const resolve = (
    model: InternalFrameModel<PageModel, Msg>,
  ): WorkspaceLayoutSnapshot<PageModel> => {
    if (matches(model) && cache != null) return cache;
    const rect = bodyRect(model);
    const maximizedPaneId =
      model.maximizedPaneByPage[model.activePageId]?.maximizedPaneId;
    const ctx = dependencies.resolveThemeContext(model.activeShellThemeId);
    const rendered = maximizedPaneId
      ? renderMaximizedPane(
          model.activePageId,
          model,
          rect,
          pagesById,
          maximizedPaneId,
          paneScratchPool,
          ctx,
        )
      : renderPageContent(model.activePageId, model, rect, pagesById, ctx);
    return remember(model, rendered.paneRects);
  };
  return {
    remember,
    paneRects: (model) => resolve(model).paneRects,
    tree: (model) => resolve(model).tree,
  };
}
