import type { FrameModel } from './app-frame-types.js';
import {
  activeRuntimeView,
  createRuntimeViewStack,
  pushRuntimeView,
} from './runtime-engine.js';
import {
  type DescribeFrameLayerStackOptions,
  type FrameLayerDescriptor,
  type FrameRuntimeViewStack,
} from './app-frame-layers.part01.js';
import {
  descriptorFromRuntimeLayer,
  frameLayer,
  toRuntimeViewLayer,
} from './app-frame-layers.part02.js';

export function describeFrameRuntimeViewStack<PageModel>(
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
): FrameRuntimeViewStack {
  let stack = createRuntimeViewStack(
    toRuntimeViewLayer(frameLayer('workspace', options)),
  );

  if (options.pageModalOpen) {
    stack = pushRuntimeView(
      stack,
      toRuntimeViewLayer(frameLayer('page-modal', options)),
    );
  }

  if (model.settingsOpen) {
    stack = pushRuntimeView(
      stack,
      toRuntimeViewLayer(frameLayer('settings', options)),
    );
  }

  if (model.helpOpen) {
    stack = pushRuntimeView(
      stack,
      toRuntimeViewLayer(frameLayer('help', options)),
    );
  }

  if (model.notificationCenterOpen) {
    stack = pushRuntimeView(
      stack,
      toRuntimeViewLayer(frameLayer('notification-center', options)),
    );
  }

  if (model.commandPalette != null) {
    const kind =
      model.commandPaletteKind === 'search' ? 'search' : 'command-palette';
    stack = pushRuntimeView(
      stack,
      toRuntimeViewLayer(frameLayer(kind, options)),
    );
  }

  if (model.quitConfirmOpen) {
    stack = pushRuntimeView(
      stack,
      toRuntimeViewLayer(frameLayer('quit-confirm', options)),
    );
  }

  return stack;
}
export function describeFrameLayerStack<PageModel>(
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
): readonly FrameLayerDescriptor[] {
  return describeFrameRuntimeViewStack(model, options).layers.map((layer) => {
    const descriptor = descriptorFromRuntimeLayer(layer);
    if (descriptor == null) {
      throw new Error(
        `describeFrameLayerStack: runtime layer "${layer.id}" is missing its frame descriptor model`,
      );
    }
    return descriptor;
  });
}
export function activeFrameLayer<PageModel>(
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
): FrameLayerDescriptor {
  const activeLayer = activeRuntimeView(
    describeFrameRuntimeViewStack(model, options),
  );
  const descriptor = descriptorFromRuntimeLayer(activeLayer);
  if (descriptor == null) {
    throw new Error(
      'activeFrameLayer: frame layer stack is missing an active descriptor',
    );
  }
  return descriptor;
}
export function underlyingFrameLayer<PageModel>(
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
): FrameLayerDescriptor | undefined {
  const stack = describeFrameRuntimeViewStack(model, options);
  return descriptorFromRuntimeLayer(
    stack.layers.length > 1 ? stack.layers[stack.layers.length - 2] : undefined,
  );
}
