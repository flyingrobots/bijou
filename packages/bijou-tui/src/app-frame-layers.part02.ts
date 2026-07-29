import { type RuntimeViewLayer } from './runtime-engine.js';
import {
  type DescribeFrameLayerStackOptions,
  type FrameLayerDescriptor,
  type FrameLayerKind,
  type FrameRuntimeLayer,
} from './app-frame-layers.part01.js';

export const FRAME_LAYER_BASE: Readonly<
  Record<
    FrameLayerKind,
    Omit<FrameLayerDescriptor, 'title' | 'hintSource' | 'helpSource'>
  >
> = {
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
export function frameLayer(
  kind: FrameLayerKind,
  options: DescribeFrameLayerStackOptions,
): FrameLayerDescriptor {
  return {
    ...FRAME_LAYER_BASE[kind],
    ...options.layers?.[kind],
  };
}
export function toRuntimeViewLayer(
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
export function descriptorFromRuntimeLayer(
  layer: FrameRuntimeLayer | undefined,
): FrameLayerDescriptor | undefined {
  if (layer == null) {
    return undefined;
  }

  if (layer.model == null) {
    throw new Error(
      `describeFrameRuntimeViewStack: runtime layer "${layer.id}" is missing its frame descriptor model`,
    );
  }

  return layer.model;
}
