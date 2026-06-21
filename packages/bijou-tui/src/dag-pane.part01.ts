import type { BijouContext, DagLayout, DagNode, SlicedDagSource, TokenValue } from '@flyingrobots/bijou';

import type { FocusAreaRenderOptions, FocusAreaState, OverflowX } from './focus-area.js';
export interface DagPaneDagOptions {
  /** Default color/style token for node box borders. */
  readonly nodeToken?: TokenValue;
  /** Color/style token for edge lines and arrowheads. */
  readonly edgeToken?: TokenValue;
  /** Color/style token for highlighted path nodes/edges. */
  readonly highlightToken?: TokenValue;
  /** Color/style token for the selected node box. */
  readonly selectedToken?: TokenValue;
  /** Fixed character width per node box. */
  readonly nodeWidth?: number;
  /** Maximum total character width. */
  readonly maxWidth?: number;
  /** Layout direction. */
  readonly direction?: 'down' | 'right';
}
export interface DagPaneState {
  /** Graph data source. */
  readonly source: DagNode[] | SlicedDagSource;
  /** Currently selected node ID, or undefined. */
  readonly selectedId: string | undefined;
  /** Cached `dagLayout()` result. */
  readonly layout: DagLayout;
  /** Ordered path from root to selected node (for highlighting). */
  readonly highlightPath: readonly string[];
  /** Underlying focus area (scroll/viewport) state. */
  readonly focusArea: FocusAreaState;
  /** DAG rendering options forwarded to `dagLayout()`. */
  readonly dagOptions: DagPaneDagOptions;
}
export interface DagPaneOptions {
  /** Graph data source (array of nodes or sliced source). */
  readonly source: DagNode[] | SlicedDagSource;
  /** Total width in columns (including gutter). */
  readonly width: number;
  /** Total height in rows. */
  readonly height: number;
  /** Initially selected node ID. */
  readonly selectedId?: string;
  /** Horizontal overflow. Default: `'scroll'` (DAGs are wide). */
  readonly overflowX?: OverflowX;
  /** DAG rendering options. */
  readonly dagOptions?: DagPaneDagOptions;
  /** Bijou context for rendering. */
  readonly ctx?: BijouContext;
}
export type DagPaneRenderOptions = FocusAreaRenderOptions;
export interface Adjacency {
  /** Map from node ID to its child IDs. */
  children: ReadonlyMap<string, readonly string[]>;
  /** Map from node ID to its parent IDs. */
  parents: ReadonlyMap<string, readonly string[]>;
  /** Root nodes (no parents). */
  roots: readonly string[];
}
