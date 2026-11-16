import type { BindingSource } from './help.js';
import {
  type RuntimeStackLayer,
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
export type FramePageLayerKind = Extract<
  FrameLayerKind,
  'workspace' | 'page-modal'
>;
export interface FrameLayerMetadata {
  readonly title?: string;
  readonly hintSource?: FrameLayerHintSource | undefined;
  readonly helpSource?: BindingSource;
}
export type FramePageLayerRegistry = Partial<
  Record<FramePageLayerKind, FrameLayerMetadata | undefined>
>;
export interface FrameLayerDescriptor {
  readonly id: string;
  readonly kind: FrameLayerKind;
  readonly owner: FrameLayerOwner;
  readonly inputMapId: string;
  readonly dismissible: boolean;
  readonly blocksUnderlyingInput: boolean;
  readonly title?: string | undefined;
  readonly hintSource?: FrameLayerHintSource | undefined;
  readonly helpSource?: BindingSource | undefined;
}
export interface DescribeFrameLayerStackOptions {
  readonly pageModalOpen?: boolean;
  readonly layers?: Partial<Record<FrameLayerKind, FrameLayerMetadata>>;
}
export interface FrameControlProjection {
  readonly layerStack: readonly FrameLayerDescriptor[];
  readonly activeLayer: FrameLayerDescriptor;
  readonly underlyingLayer?: FrameLayerDescriptor | undefined;
  readonly footerHintSource?: FrameLayerHintSource | undefined;
  readonly helpSource?: BindingSource | undefined;
}
export type FrameRuntimeLayer = RuntimeStackLayer<FrameLayerDescriptor>;
export type FrameRuntimeViewStack = RuntimeViewStack<FrameLayerDescriptor>;
