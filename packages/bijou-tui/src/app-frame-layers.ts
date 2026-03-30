import type { FrameModel } from './app-frame.js';

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

export interface FrameLayerDescriptor {
  readonly kind: FrameLayerKind;
  readonly owner: FrameLayerOwner;
  readonly inputMapId: string;
  readonly dismissible: boolean;
  readonly blocksUnderlyingInput: boolean;
}

export interface DescribeFrameLayerStackOptions {
  readonly pageModalOpen?: boolean;
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
  const stack: FrameLayerDescriptor[] = [{
    kind: 'workspace',
    owner: 'frame',
    inputMapId: 'frame-workspace',
    dismissible: false,
    blocksUnderlyingInput: false,
  }];

  if (options.pageModalOpen) {
    stack.push({
      kind: 'page-modal',
      owner: 'page',
      inputMapId: 'page-modal',
      dismissible: true,
      blocksUnderlyingInput: true,
    });
  }

  if (model.settingsOpen) {
    stack.push({
      kind: 'settings',
      owner: 'frame',
      inputMapId: 'frame-settings',
      dismissible: true,
      blocksUnderlyingInput: true,
    });
  }

  if (model.helpOpen) {
    stack.push({
      kind: 'help',
      owner: 'frame',
      inputMapId: 'frame-help',
      dismissible: true,
      blocksUnderlyingInput: true,
    });
  }

  if (model.notificationCenterOpen) {
    stack.push({
      kind: 'notification-center',
      owner: 'frame',
      inputMapId: 'frame-notification-center',
      dismissible: true,
      blocksUnderlyingInput: true,
    });
  }

  if (model.commandPalette != null) {
    const kind = model.commandPaletteKind === 'search' ? 'search' : 'command-palette';
    stack.push({
      kind,
      owner: 'frame',
      inputMapId: kind === 'search' ? 'frame-search' : 'frame-command-palette',
      dismissible: true,
      blocksUnderlyingInput: true,
    });
  }

  if (model.quitConfirmOpen) {
    stack.push({
      kind: 'quit-confirm',
      owner: 'frame',
      inputMapId: 'frame-quit-confirm',
      dismissible: true,
      blocksUnderlyingInput: true,
    });
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
