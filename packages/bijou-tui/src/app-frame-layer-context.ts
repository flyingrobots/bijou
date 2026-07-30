import type { KeyMap } from './keybindings.js';
import type {
  FrameInputArea,
  FramePage,
} from './app-frame-page-contract.js';
import type {
  FrameLayerDescriptor,
} from './app-frame-layers.js';
import { activeFrameLayer } from './app-frame-layers.js';
import type { InternalFrameModel } from './app-frame-types.js';
import {
  findInputAreaByPaneId,
  resolveInputAreas,
} from './app-frame-overlays.js';

export interface FrameLayerContext<PageModel, Msg> {
  readonly activePage: FramePage<PageModel, Msg>;
  readonly activePageModel: PageModel;
  readonly inputAreas: readonly FrameInputArea<PageModel, Msg>[];
  readonly activeInputArea: FrameInputArea<PageModel, Msg> | undefined;
  readonly modalKeyMap: KeyMap<Msg> | undefined;
  readonly pageModalOpen: boolean;
  readonly activeLayer: FrameLayerDescriptor;
}

export function resolveFrameLayerContext<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): FrameLayerContext<PageModel, Msg> {
  const activePage = pagesById.get(model.activePageId);
  const activePageModel = model.pageModels[model.activePageId];
  if (activePage == null || activePageModel === undefined) {
    throw new Error(
      `createFramedApp: active page "${model.activePageId}" is missing`,
    );
  }
  const inputAreas = resolveInputAreas(activePage, activePageModel);
  const activeInputArea = findInputAreaByPaneId(
    inputAreas,
    model.focusedPaneByPage[model.activePageId],
  );
  const modalKeyMap = activePage.modalKeyMap?.(activePageModel);
  const pageModalOpen = modalKeyMap != null;
  return {
    activePage,
    activePageModel,
    inputAreas,
    activeInputArea,
    modalKeyMap,
    pageModalOpen,
    activeLayer: activeFrameLayer(model, { pageModalOpen }),
  };
}
