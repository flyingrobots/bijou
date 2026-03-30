import type { FrameModel } from './app-frame.js';
import type { BindingSource } from './help.js';

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

export interface FrameLayerMetadata {
  readonly title?: string;
  readonly hintSource?: FrameLayerHintSource;
  readonly helpSource?: BindingSource;
}

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
  const stack: FrameLayerDescriptor[] = [frameLayer('workspace', options)];

  if (options.pageModalOpen) {
    stack.push(frameLayer('page-modal', options));
  }

  if (model.settingsOpen) {
    stack.push(frameLayer('settings', options));
  }

  if (model.helpOpen) {
    stack.push(frameLayer('help', options));
  }

  if (model.notificationCenterOpen) {
    stack.push(frameLayer('notification-center', options));
  }

  if (model.commandPalette != null) {
    const kind = model.commandPaletteKind === 'search' ? 'search' : 'command-palette';
    stack.push(frameLayer(kind, options));
  }

  if (model.quitConfirmOpen) {
    stack.push(frameLayer('quit-confirm', options));
  }

  return stack;
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
  const stack = describeFrameLayerStack(model, options);
  return stack[stack.length - 1]!;
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
  const stack = describeFrameLayerStack(model, options);
  return stack.length > 1 ? stack[stack.length - 2] : undefined;
}
