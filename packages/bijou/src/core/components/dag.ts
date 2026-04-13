import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import { resolveCtx } from '../resolve-ctx.js';
import { isDagSource, isSlicedDagSource, arraySource, materialize, sliceSource } from './dag-source.js';
import type { DagSource, SlicedDagSource, DagSliceOptions } from './dag-source.js';
import { assignLayers } from './dag-layout.js';
import { renderInteractiveLayout, renderPipe, renderAccessible } from './dag-render.js';
import { renderByMode } from '../mode-render.js';

// ── Types ──────────────────────────────────────────────────────────

/**
 * A single node in a directed graph rendered through the DAG component.
 *
 * Each node has a unique `id`, a display `label`, and optional outgoing
 * `edges` pointing to child node IDs. Nodes may carry per-node style
 * tokens and an optional badge string.
 */
export interface DagNode {
  /** Unique identifier for this node within the graph. */
  id: string;
  /** Human-readable display text rendered inside the node box. */
  label: string;
  /** IDs of child nodes this node has outgoing edges to. */
  edges?: readonly string[];
  /** Short annotation text displayed alongside the label (e.g., a status or count). */
  badge?: string;
  /** Color/style token applied to the node box border. */
  token?: TokenValue;
  /** Color/style token applied to the label text only. */
  labelToken?: TokenValue;
  /** Color/style token applied to the badge text only. */
  badgeToken?: TokenValue;
  /** @internal Used by dagSlice to mark ghost boundary nodes. */
  _ghost?: boolean;
  /** @internal Ghost label override text (e.g., "... 3 ancestors"). */
  _ghostLabel?: string;
}

/**
 * Rendering options for `dag()` and `dagLayout()`.
 *
 * Controls visual styling (tokens), selection highlighting, layout
 * constraints, and the bijou context to use.
 */
export interface DagOptions {
  /** Default color/style token for all node box borders. */
  nodeToken?: TokenValue;
  /** Color/style token for edge lines and arrowheads. */
  edgeToken?: TokenValue;
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
  /** Maximum total character width for the rendered graph. Defaults to terminal columns. */
  maxWidth?: number;
  /** Layout direction. Currently only `'down'` is implemented. */
  direction?: 'down' | 'right';
  /** Bijou context providing runtime, I/O, style, and theme ports. */
  ctx?: BijouContext;
}

/**
 * Grid coordinates and dimensions of a rendered node box.
 *
 * Used by `dagLayout()` to report where each node was placed in the
 * character grid, enabling hit-testing for mouse/keyboard interaction.
 */
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

/**
 * Full layout result returned by `dagLayout()`.
 *
 * Contains the rendered string output, a map of node positions for
 * hit-testing, and the overall grid dimensions.
 */
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

// ── dagSlice ───────────────────────────────────────────────────────

/**
 * Extract a subgraph centered on a focus node.
 *
 * When given a `DagSource`, return a bounded `SlicedDagSource`.
 * When given a `DagNode[]`, return a filtered `DagNode[]` for backward
 * compatibility. Ghost boundary nodes are injected at depth limits.
 *
 * @param input - The full graph, as either a `DagSource` or `DagNode[]`.
 * @param focus - ID of the node to center the slice around.
 * @param opts - Slice direction and depth constraints.
 * @returns A bounded subgraph of the appropriate type.
 */
export function dagSlice(
  source: DagSource,
  focus: string,
  opts?: DagSliceOptions,
): SlicedDagSource;
export function dagSlice(
  nodes: readonly DagNode[],
  focus: string,
  opts?: DagSliceOptions,
): DagNode[];
export function dagSlice(
  input: readonly DagNode[] | DagSource,
  focus: string,
  opts?: DagSliceOptions,
): DagNode[] | SlicedDagSource {
  if (isDagSource(input)) {
    return sliceSource(input, focus, opts);
  }
  // Array path: wrap, slice, materialize back for backward compat
  const source = arraySource([...input]);
  return materialize(sliceSource(source, focus, opts));
}

// ── dagLayout ──────────────────────────────────────────────────────

/**
 * Compute the full DAG layout including node positions and rendered output.
 *
 * Unlike `dag()`, this returns a `DagLayout` object with both the rendered
 * string and a map of node positions for hit-testing and interaction.
 *
 * @param input - A `SlicedDagSource` or `DagNode[]` to lay out.
 * @param options - Rendering options (tokens, selection, sizing).
 * @returns The layout result with output string, node positions, and dimensions.
 * @throws If given an unbounded `DagSource` (must call `dagSlice()` first).
 */
export function dagLayout(source: SlicedDagSource, options?: DagOptions): DagLayout;
export function dagLayout(nodes: readonly DagNode[], options?: DagOptions): DagLayout;
export function dagLayout(
  input: readonly DagNode[] | SlicedDagSource,
  options: DagOptions = {},
): DagLayout {
  if (isDagSource(input) && !isSlicedDagSource(input)) {
    throw new Error(
      '[bijou] dagLayout(): received an unbounded DagSource. Use dagSlice() to produce a SlicedDagSource first.',
    );
  }
  const ctx = resolveCtx(options.ctx);
  const nodes = isSlicedDagSource(input) ? materialize(input) : [...input];
  if (nodes.length === 0) return { output: '', nodes: new Map(), width: 0, height: 0 };
  return renderInteractiveLayout(nodes, options, ctx);
}

// ── Main Entry Point ───────────────────────────────────────────────

/**
 * Render a directed graph as a styled string.
 *
 * Adapts output to the current context mode:
 * - `'interactive'` / `'static'`: Unicode box-drawing with ANSI styling.
 * - `'pipe'`: Plain text `Label -> Target` lines.
 * - `'accessible'`: Structured text with cycle-tolerant layer groupings.
 *
 * @param input - A `SlicedDagSource` or `DagNode[]` to render.
 * @param options - Rendering options (tokens, selection, sizing).
 * @returns The rendered graph string.
 * Cycle-forming back-edges are ignored only for layer assignment; the full
 * original edge set is still rendered.
 *
 * @throws If given an unbounded `DagSource` (must call `dagSlice()` first).
 */
export function dag(source: SlicedDagSource, options?: DagOptions): string;
export function dag(nodes: readonly DagNode[], options?: DagOptions): string;
export function dag(
  input: readonly DagNode[] | SlicedDagSource,
  options: DagOptions = {},
): string {
  if (isDagSource(input) && !isSlicedDagSource(input)) {
    throw new Error(
      '[bijou] dag(): received an unbounded DagSource. Use dagSlice() to produce a SlicedDagSource first.',
    );
  }
  const ctx = resolveCtx(options.ctx);
  const nodes = isSlicedDagSource(input) ? materialize(input) : [...input];

  if (nodes.length === 0) return '';

  return renderByMode(ctx.mode, {
    pipe: () => renderPipe(nodes),
    accessible: () => {
      const layerMap = assignLayers(nodes);
      return renderAccessible(nodes, layerMap);
    },
    interactive: () => renderInteractiveLayout(nodes, options, ctx).output,
  }, options);
}
