import type { InternalFrameModel } from './app-frame-types.js';
import type { FramePage } from './app-frame-page-contract.js';
import {
  projectFrameControls,
} from './app-frame-layers.js';
import { resolveFrameLayerContext } from './app-frame-layer-context.js';
import {
  resolveLayerMetadata,
  type FrameLayerMetadataDependencies,
} from './app-frame-layer-metadata.js';

export interface FramePresentationDependencies<PageModel, Msg>
  extends FrameLayerMetadataDependencies<PageModel, Msg> {
  readonly pagesById: Map<string, FramePage<PageModel, Msg>>;
}

export function resolvePresentedLayerContext<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  dependencies: FramePresentationDependencies<PageModel, Msg>,
) {
  const context = resolveFrameLayerContext(model, dependencies.pagesById);
  const layerMetadata = resolveLayerMetadata(
    model,
    context.activePage,
    context.activePageModel,
    context.activeInputArea,
    context.modalKeyMap,
    dependencies,
  );
  const controlProjection = projectFrameControls(model, {
    pageModalOpen: context.pageModalOpen,
    layers: layerMetadata,
  });
  return {
    ...context,
    layerMetadata,
    controlProjection,
    layerStack: controlProjection.layerStack,
    activeLayer: controlProjection.activeLayer,
    underlyingLayer: controlProjection.underlyingLayer,
  };
}
