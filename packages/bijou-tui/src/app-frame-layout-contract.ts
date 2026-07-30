import type { TokenValue } from '@flyingrobots/bijou';
import type { GridTrack } from './grid.js';
import type { OverflowX } from './focus-area.js';
import type { LayoutRect } from './layout-rect.js';
import type { SplitPaneDirection, SplitPaneState } from './split-pane.js';
import type { ViewOutput } from './view-output.js';

/** Declarative frame layout node. */
export type FrameLayoutNode =
  | {
      readonly kind: 'pane';
      readonly paneId: string;
      /** Pane content must be a Surface or LayoutNode. */
      readonly render: (width: number, height: number) => ViewOutput;
      readonly overflowX?: OverflowX;
      readonly focusedGutterToken?: TokenValue;
      readonly unfocusedGutterToken?: TokenValue;
    }
  | {
      readonly kind: 'split';
      readonly splitId: string;
      readonly direction?: SplitPaneDirection;
      readonly state: SplitPaneState;
      readonly minA?: number;
      readonly minB?: number;
      readonly paneA: FrameLayoutNode;
      readonly paneB: FrameLayoutNode;
      readonly dividerChar?: string;
    }
  | {
      readonly kind: 'grid';
      readonly gridId: string;
      readonly columns: readonly GridTrack[];
      readonly rows: readonly GridTrack[];
      readonly areas: readonly string[];
      readonly gap?: number;
      readonly cells: Readonly<Record<string, FrameLayoutNode>>;
    };

/** Context passed to an application-owned overlay factory. */
export interface FrameOverlayContext<PageModel> {
  /** Active page id. */
  readonly activePageId: string;
  /** Active page model. */
  readonly pageModel: PageModel;
  /** Absolute pane rectangles for the active page. */
  readonly paneRects: ReadonlyMap<string, LayoutRect>;
  /** Full-screen bounds. */
  readonly screenRect: LayoutRect;
}
