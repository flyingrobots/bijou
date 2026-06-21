import type { LayoutRect } from '../ports/surface.js';
export const SELECTION_OWNER_BRAND: unique symbol = Symbol('SelectionOwner');
export type SelectionDragSource = 'mouse' | 'touch' | 'keyboard' | 'unknown';
export type SelectionDirection = 'forward' | 'backward';
export type SelectionPolicy = 'selectable' | 'disabled';
export type SelectionBlockerReason =
  | 'overlay'
  | 'drag-handle'
  | 'component-handler'
  | 'terminal-native';
export interface SelectionPoint {
  readonly x: number;
  readonly y: number;
}
export interface SelectionViewportTransform {
  readonly scrollX?: number;
  readonly scrollY?: number;
}
export interface ProseSelectionContentModel {
  readonly kind: 'prose';
  readonly paragraphs: readonly string[];
}
export interface SurfaceSelectionContentModel {
  readonly kind: 'surface';
  readonly lines: readonly string[];
}
export interface TableSelectionContentModel {
  readonly kind: 'table';
  readonly rows: readonly (readonly string[])[];
  readonly delimiter?: string;
}
export interface MixedSelectionContentRegion {
  readonly id: string;
  readonly rect: LayoutRect;
  readonly content: SelectionContentModel;
}
export interface MixedSelectionContentModel {
  readonly kind: 'mixed';
  readonly regions: readonly MixedSelectionContentRegion[];
  readonly separator?: string;
}
export type SelectionContentModel =
  | ProseSelectionContentModel
  | SurfaceSelectionContentModel
  | TableSelectionContentModel
  | MixedSelectionContentModel;
export interface SelectionOwnerInput {
  readonly id: string;
  readonly layoutNodeId: string;
  readonly rect: LayoutRect;
  readonly viewport?: SelectionViewportTransform;
  readonly policy?: string;
  readonly zIndex?: number;
  readonly content: SelectionContentModel;
}
export interface SelectionOwner {
  readonly [SELECTION_OWNER_BRAND]: true;
  readonly id: string;
  readonly layoutNodeId: string;
  readonly rect: LayoutRect;
  readonly viewport: Required<SelectionViewportTransform>;
  readonly policy: SelectionPolicy;
  readonly zIndex: number;
  readonly content: SelectionContentModel;
}
export interface SelectionRegion {
  readonly ownerId: string;
  readonly layoutNodeId: string;
  readonly screenRect: LayoutRect;
  readonly contentRect: LayoutRect;
  readonly clippingRect: LayoutRect;
  readonly zIndex: number;
  readonly enabled: boolean;
}
export interface SelectionRangeInput {
  readonly anchor: SelectionPoint;
  readonly focus: SelectionPoint;
  readonly dragSource?: SelectionDragSource;
}
export interface SelectionRange {
  readonly ownerId: string;
  readonly anchor: SelectionPoint;
  readonly focus: SelectionPoint;
  readonly start: SelectionPoint;
  readonly end: SelectionPoint;
  readonly contentRect: LayoutRect;
  readonly direction: SelectionDirection;
  readonly dragSource: SelectionDragSource;
}
export interface SelectionBlocker {
  readonly id: string;
  readonly reason: SelectionBlockerReason;
  readonly rect: LayoutRect;
}
