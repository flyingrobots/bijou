import type { FrameModel } from './app-frame-types.js';
import {
  type DescribeFrameLayerStackOptions,
  type FrameControlProjection,
} from './app-frame-layers.part01.js';
import { describeFrameLayerStack } from './app-frame-layers.part03.js';

export function projectFrameControls<PageModel>(
  model: Pick<
    FrameModel<PageModel>,
    | 'helpOpen'
    | 'commandPalette'
    | 'commandPaletteKind'
    | 'settingsOpen'
    | 'notificationCenterOpen'
    | 'quitConfirmOpen'
  >,
  options: DescribeFrameLayerStackOptions = {},
): FrameControlProjection {
  const layerStack = describeFrameLayerStack(model, options);
  const activeLayer = layerStack[layerStack.length - 1];
  if (activeLayer == null) {
    throw new Error(
      'projectFrameControls: frame layer stack is missing an active descriptor',
    );
  }
  const underlyingLayer =
    layerStack.length > 1 ? layerStack[layerStack.length - 2] : undefined;
  const workspaceLayer = layerStack[0];
  const helpSource =
    activeLayer.kind === 'help'
      ? (underlyingLayer?.helpSource ?? workspaceLayer?.helpSource)
      : (activeLayer.helpSource ?? workspaceLayer?.helpSource);

  return {
    layerStack,
    activeLayer,
    underlyingLayer,
    footerHintSource: activeLayer.hintSource,
    helpSource,
  };
}
