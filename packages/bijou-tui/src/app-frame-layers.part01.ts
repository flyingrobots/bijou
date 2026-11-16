import type { BindingSource } from './help.js';
import {
  type RuntimeStackLayer,
  type RuntimeViewStack,
} from './runtime-engine.js';

export type FrameLayerKind =
  | 'workspace'
  | 'context-drawer'
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
  'workspace' | 'context-drawer' | 'page-modal'
>;
export interface FrameLayerMetadata {
  readonly title?: string;
  readonly hintSource?: FrameLayerHintSource | undefined;
  readonly helpSource?: BindingSource;
}
/** Page-owned context-drawer layer; active only while `paneId` has focus. */
export interface FrameContextDrawerLayerMetadata extends FrameLayerMetadata {
  readonly paneId: string;
}
export interface FramePageLayerRegistry {
  readonly workspace?: FrameLayerMetadata | undefined;
  readonly 'context-drawer'?: FrameContextDrawerLayerMetadata | undefined;
  readonly 'page-modal'?: FrameLayerMetadata | undefined;
}
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
  /** Push the page `context-drawer` layer directly above `workspace`. */
  readonly contextDrawerFocused?: boolean;
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
