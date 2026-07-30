import type { Surface } from '@flyingrobots/bijou';
import type { FrameLayoutNode } from './app-frame.js';
import type { RenderContext } from './app-frame-types.js';
import type { LayoutRect } from './layout-rect.js';
import type { FramePaneScratchPool } from './app-frame-render-scratch.js';

export interface FrameHeaderTabTarget {
  readonly pageId: string;
  readonly startCol: number;
  readonly endCol: number;
}

export interface FrameHeaderRenderResult {
  readonly surface: Surface;
  readonly tabTargets: readonly FrameHeaderTabTarget[];
}

export interface PaintedFrameNodeResult {
  readonly paneRects: ReadonlyMap<string, LayoutRect>;
  readonly paneOrder: readonly string[];
}

export interface FramePaneGeometryResult {
  readonly paneRects: ReadonlyMap<string, LayoutRect>;
  readonly paneOrder: readonly string[];
}

export type FramePaneNode = Extract<FrameLayoutNode, { readonly kind: 'pane' }>;

export type FrameSplitNode = Extract<
  FrameLayoutNode,
  { readonly kind: 'split' }
>;

export type FrameGridNode = Extract<FrameLayoutNode, { readonly kind: 'grid' }>;

export type PaintFrameNode = <PageModel, Msg>(
  node: FrameLayoutNode,
  localRect: LayoutRect,
  absoluteRect: LayoutRect,
  ctx: RenderContext<PageModel, Msg>,
  target: Surface,
  scratchPool: FramePaneScratchPool,
) => PaintedFrameNodeResult;
