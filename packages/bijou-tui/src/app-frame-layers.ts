import type { FrameModel } from './app-frame-types.js';
import type { BindingSource } from './help.js';
import {
  activeRuntimeView,
  createRuntimeViewStack,
  pushRuntimeView,
  type RuntimeStackLayer,
  type RuntimeViewLayer,
  type RuntimeViewStack,
} from './runtime-engine.js';

export type FrameLayerKind =
  | 'workspace'
  | 'page-modal'
  | 'help'
  | 'settings'
  | 'notification-center'
  | 'search'
  | 'command-palette'
  | 'quit-confirm';

export type FrameLayerOwner = 'frame' | 'page';

export type FrameLayerHintSource = string | BindingSource;

export type FramePageLayerKind = Extract<FrameLayerKind, 'workspace' | 'page-modal'>;

export interface FrameLayerMetadata {
  readonly title?: string;
  readonly hintSource?: FrameLayerHintSource;
  readonly helpSource?: BindingSource;
}

export type FramePageLayerRegistry = Partial<Record<FramePageLayerKind, FrameLayerMetadata>>;

export interface FrameLayerDescriptor {
  readonly id: string;
  readonly kind: FrameLayerKind;
  readonly owner: FrameLayerOwner;
  readonly inputMapId: string;
  readonly dismissible: boolean;
  readonly blocksUnderlyingInput: boolean;
  readonly title?: string;
  readonly hintSource?: FrameLayerHintSource;
  readonly helpSource?: BindingSource;
}

export interface DescribeFrameLayerStackOptions {
  readonly pageModalOpen?: boolean;
  readonly layers?: Partial<Record<FrameLayerKind, FrameLayerMetadata>>;
}

export interface FrameControlProjection {
  readonly layerStack: readonly FrameLayerDescriptor[];
  readonly activeLayer: FrameLayerDescriptor;
  readonly underlyingLayer?: FrameLayerDescriptor;
  readonly footerHintSource?: FrameLayerHintSource;
  readonly helpSource?: BindingSource;
}

export type FrameRuntimeLayer = RuntimeStackLayer<FrameLayerDescriptor>;
export type FrameRuntimeViewStack = RuntimeViewStack<FrameLayerDescriptor>;

const FRAME_LAYER_BASE: Readonly<Record<FrameLayerKind, Omit<FrameLayerDescriptor, 'title' | 'hintSource' | 'helpSource'>>> = {
  workspace: {
    id: 'workspace',
    kind: 'workspace',
    owner: 'frame',
    inputMapId: 'frame-workspace',
    dismissible: false,
    blocksUnderlyingInput: false,
  },
  'page-modal': {
    id: 'page-modal',
    kind: 'page-modal',
    owner: 'page',
    inputMapId: 'page-modal',
    dismissible: true,
    blocksUnderlyingInput: true,
  },
  help: {
    id: 'help',
    kind: 'help',
    owner: 'frame',
    inputMapId: 'frame-help',
    dismissible: true,
    blocksUnderlyingInput: true,
  },
  settings: {
    id: 'settings',
    kind: 'settings',
    owner: 'frame',
    inputMapId: 'frame-settings',
    dismissible: true,
    blocksUnderlyingInput: true,
  },
  'notification-center': {
    id: 'notification-center',
    kind: 'notification-center',
    owner: 'frame',
    inputMapId: 'frame-notification-center',
    dismissible: true,
    blocksUnderlyingInput: true,
  },
  search: {
    id: 'search',
    kind: 'search',
    owner: 'frame',
    inputMapId: 'frame-search',
    dismissible: true,
    blocksUnderlyingInput: true,
  },
  'command-palette': {
    id: 'command-palette',
    kind: 'command-palette',
    owner: 'frame',
    inputMapId: 'frame-command-palette',
    dismissible: true,
    blocksUnderlyingInput: true,
  },
  'quit-confirm': {
    id: 'quit-confirm',
    kind: 'quit-confirm',
    owner: 'frame',
    inputMapId: 'frame-quit-confirm',
    dismissible: true,
    blocksUnderlyingInput: true,
  },
};

function frameLayer(
  kind: FrameLayerKind,
  options: DescribeFrameLayerStackOptions,
): FrameLayerDescriptor {
  return {
    ...FRAME_LAYER_BASE[kind],
    ...options.layers?.[kind],
  };
}

function toRuntimeViewLayer(
  descriptor: FrameLayerDescriptor,
): RuntimeViewLayer<FrameLayerDescriptor> {
  return {
    id: descriptor.id,
    kind: descriptor.kind,
    dismissible: descriptor.dismissible,
    blocksBelow: descriptor.blocksUnderlyingInput,
    model: descriptor,
  };
}

function descriptorFromRuntimeLayer(
  layer: FrameRuntimeLayer | undefined,
): FrameLayerDescriptor | undefined {
  if (layer == null) {
    return undefined;
  }

  if (layer.model == null) {
    throw new Error(`describeFrameRuntimeViewStack: runtime layer "${layer.id}" is missing its frame descriptor model`);
  }

  return layer.model;
}

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
    stack = pushRuntimeView(stack, toRuntimeViewLayer(frameLayer('page-modal', options)));
  }

  if (model.settingsOpen) {
    stack = pushRuntimeView(stack, toRuntimeViewLayer(frameLayer('settings', options)));
  }

  if (model.helpOpen) {
    stack = pushRuntimeView(stack, toRuntimeViewLayer(frameLayer('help', options)));
  }

  if (model.notificationCenterOpen) {
    stack = pushRuntimeView(
      stack,
      toRuntimeViewLayer(frameLayer('notification-center', options)),
    );
  }

  if (model.commandPalette != null) {
    const kind = model.commandPaletteKind === 'search' ? 'search' : 'command-palette';
    stack = pushRuntimeView(stack, toRuntimeViewLayer(frameLayer(kind, options)));
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
      throw new Error(`describeFrameLayerStack: runtime layer "${layer.id}" is missing its frame descriptor model`);
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
  const activeLayer = activeRuntimeView(describeFrameRuntimeViewStack(model, options));
  const descriptor = descriptorFromRuntimeLayer(activeLayer);
  if (descriptor == null) {
    throw new Error('activeFrameLayer: frame layer stack is missing an active descriptor');
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
    throw new Error('projectFrameControls: frame layer stack is missing an active descriptor');
  }
  const underlyingLayer = layerStack.length > 1 ? layerStack[layerStack.length - 2] : undefined;
  const workspaceLayer = layerStack[0];
  const helpSource = activeLayer.kind === 'help'
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
