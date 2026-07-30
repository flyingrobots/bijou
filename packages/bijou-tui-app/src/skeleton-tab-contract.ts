import type { BijouContext } from '@flyingrobots/bijou';
import type {
  FrameLayoutNode,
  ViewOutput,
} from '@flyingrobots/bijou-tui';
import type { SkeletonPageModel } from './skeleton-contract.js';

/** Context passed to consumer-provided skeleton page renderers. */
export interface SkeletonRenderContext {
  /** Bijou context used by the skeleton shell. */
  readonly ctx: BijouContext;
  /** Tab being rendered. */
  readonly tab: SkeletonTab;
  /** Current skeleton-owned page model. */
  readonly model: SkeletonPageModel;
}

/** Context passed to consumer-provided skeleton layout factories. */
export interface SkeletonLayoutContext {
  /** Bijou context used by the skeleton shell. */
  readonly ctx: BijouContext;
  /** Tab being rendered. */
  readonly tab: SkeletonTab;
  /** Current skeleton-owned page model. */
  readonly model: SkeletonPageModel;
}

/** Single top-level tab in the app skeleton. */
export interface SkeletonTab {
  /** Stable tab id. */
  readonly id: string;
  /** Visible tab label. */
  readonly title: string;
  /**
   * Optional pane renderer for this tab.
   *
   * Use this when the page body is a single pane. Return a `Surface` or
   * `LayoutNode`; strings are intentionally not accepted by the framed-app
   * render seam.
   */
  readonly render?: (
    width: number,
    height: number,
    context: SkeletonRenderContext,
  ) => ViewOutput;
  /**
   * Optional full frame layout factory for this tab.
   *
   * Use this when the page owns splits, grids, or custom pane topology.
   */
  readonly layout?: (context: SkeletonLayoutContext) => FrameLayoutNode;
}

/** Resolved active-tab metadata for dynamic status rendering. */
export interface SkeletonStatusContext {
  /** Active tab id. */
  readonly activeTabId: string;
  /** Active tab title. */
  readonly activeTabTitle: string;
}
