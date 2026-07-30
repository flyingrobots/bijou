import type { CreateFramedAppOptions } from './app-frame-options.js';
import type { InternalFrameModel } from './app-frame-types.js';
import type { LayoutRect } from './layout-rect.js';
import { frameBodyRect } from './app-frame-utils.js';

export function focusPane<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  paneId: string,
): InternalFrameModel<PageModel, Msg> {
  if (model.focusedPaneByPage[model.activePageId] === paneId) {
    return model;
  }
  return {
    ...model,
    focusedPaneByPage: {
      ...model.focusedPaneByPage,
      [model.activePageId]: paneId,
    },
  };
}

export function resolveBodyRect<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
): LayoutRect {
  return frameBodyRect(
    model.columns,
    model.rows,
    options.bodyTopRows ?? 1,
    options.bodyBottomRows ?? 1,
  );
}
