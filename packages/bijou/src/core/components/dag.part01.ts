import type { BijouContext } from '../../ports/context.js';

import type { TokenValue } from '../theme/tokens.js';

export type DagEdgeStyle = 'single' | 'heavy' | 'double' | 'dashed';
export type DagNodeStyle = 'box' | 'compact';
export type DagCompactShape = 'square' | 'round' | 'angle' | 'brace' | 'plain';
export interface DagNode {
  /** Unique identifier for this node within the graph. */
  id: string;
  /** Human-readable display text rendered inside the node box. */
  label: string;
  /** IDs of child nodes this node has outgoing edges to. */
  edges?: readonly string[];
  /** Short annotation text displayed alongside the label (e.g., a status or count). */
  badge?: string;
  /** Compact node wrapper used when `nodeStyle: 'compact'` is active. */
  compactShape?: DagCompactShape;
  /** Color/style token applied to the node box border. */
  token?: TokenValue;
  /** Background token applied behind the node border and content. */
  bgToken?: TokenValue;
  /** Color/style token applied to the label text only. */
  labelToken?: TokenValue;
  /** Color/style token applied to the badge text only. */
  badgeToken?: TokenValue;
  /** @internal Used by dagSlice to mark ghost boundary nodes. */
  _ghost?: boolean;
  /** @internal Ghost label override text (e.g., "... 3 ancestors"). */
  _ghostLabel?: string;
}
export interface DagOptions {
  /** Default color/style token for all node box borders. */
  nodeToken?: TokenValue;
  /** Default background token applied behind node borders and labels. */
  nodeBgToken?: TokenValue;
  /** Color/style token for edge lines and arrowheads. */
  edgeToken?: TokenValue;
  /** Glyph family used for edge lines and junctions. */
  edgeStyle?: DagEdgeStyle;
  /** Ordered list of node IDs forming a path to highlight. */
  highlightPath?: string[];
  /** Color/style token applied to highlighted path edges and nodes. */
  highlightToken?: TokenValue;
  /** ID of the currently selected node (e.g., for keyboard navigation). */
  selectedId?: string;
  /** Color/style token applied to the selected node box. */
  selectedToken?: TokenValue;
  /** Fixed character width for every node box. Auto-calculated when omitted. */
  nodeWidth?: number;
  /** Node renderer family. `'box'` is the default rich mode, `'compact'` is a one-line fallback. */
  nodeStyle?: DagNodeStyle;
  /** Maximum total character width for the rendered graph. Defaults to terminal columns. */
  maxWidth?: number;
  /** Layout direction. Currently only `'down'` is implemented. */
  direction?: 'down' | 'right';
  /** Bijou context providing runtime, I/O, style, and theme ports. */
  ctx?: BijouContext;
}
export interface DagNodePosition {
  /** Zero-based row of the top-left corner of the node box. */
  readonly row: number;
  /** Zero-based column of the top-left corner of the node box. */
  readonly col: number;
  /** Character width of the node box. */
  readonly width: number;
  /** Character height of the node box (always 3: top border, content, bottom border). */
  readonly height: number;
}
export interface DagLayout {
  /** The fully rendered, styled graph string (may contain ANSI escape codes). */
  readonly output: string;
  /** Map from node ID to its position and dimensions in the character grid. */
  readonly nodes: ReadonlyMap<string, DagNodePosition>;
  /** Total character width of the rendered grid. */
  readonly width: number;
  /** Total character height (rows) of the rendered grid. */
  readonly height: number;
}
