import type { FramePage, CreateFramedAppOptions } from './app-frame.js';
import type { InternalFrameModel } from './app-frame-types.js';
import { createPanelDockState } from './panel-dock.js';
import { createPanelVisibilityState } from './panel-state.js';
import { renderFrameNode } from './app-frame-render.js';
import { findPaneNode, frameBodyRect } from './app-frame-utils.js';
import { renderPaneSurfaceForMeasurement } from './app-frame-actions-measure.js';
import type {
  FocusedPaneMeasureCache,
  FocusedPaneMeasurement,
  FocusedPaneMeasurementKey,
} from './app-frame-scroll-measure-cache.js';

/** Today's full layout and render measurement; stores the result. */
export function measureFocusedPane<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  key: FocusedPaneMeasurementKey,
  page: FramePage<PageModel, Msg>,
  pageModel: PageModel,
  options: CreateFramedAppOptions<PageModel, Msg>,
  cache: FocusedPaneMeasureCache,
): FocusedPaneMeasurement | undefined {
  const { pageId, paneId } = key;
  const layoutTree = page.layout(pageModel);
  const bodyRect = frameBodyRect(
    model.columns,
    model.rows,
    options.bodyTopRows ?? 1,
    options.bodyBottomRows ?? 1,
  );
  const resolved = renderFrameNode(layoutTree, bodyRect, {
    model,
    pageId,
    focusedPaneId: paneId,
    scrollByPane: model.scrollByPage[pageId] ?? {},
    visibility:
      model.minimizedByPage[pageId] ?? createPanelVisibilityState(),
    dockState: model.dockStateByPage[pageId] ?? createPanelDockState(),
    frameBackgroundToken: undefined,
  });
  const paneRect = resolved.paneRects.get(paneId);
  if (
    paneRect == null
    || paneRect.width <= 0
    || paneRect.height <= 0
  ) {
    return undefined;
  }
  const paneNode = findPaneNode(layoutTree, paneId);
  if (paneNode == null) return undefined;
  const surface = renderPaneSurfaceForMeasurement(
    paneNode.render(paneRect.width, paneRect.height),
    paneRect.width,
    paneRect.height,
    cache,
  );
  const measurement: FocusedPaneMeasurement = {
    key,
    paneWidth: paneRect.width,
    paneHeight: paneRect.height,
    overflowX: paneNode.overflowX ?? 'hidden',
    contentWidth: surface.width,
    contentHeight: surface.height,
  };
  cache.store(measurement);
  return measurement;
}
