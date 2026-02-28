import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import { getDefaultContext } from '../../context.js';
import { isDagSource, isSlicedDagSource, arraySource, materialize, sliceSource } from './dag-source.js';
import type { DagSource, SlicedDagSource, DagSliceOptions } from './dag-source.js';
import { graphemeWidth, segmentGraphemes } from '../text/grapheme.js';

// ── Types ──────────────────────────────────────────────────────────

/**
 * A single node in a directed acyclic graph.
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
  edges?: string[];
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
  /** Character height of the node box (typically 3: top border, content, bottom border). */
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

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Resolve the bijou context, falling back to the global default.
 *
 * @param ctx - Explicit context override, if provided.
 * @returns The provided context or the global default context.
 */
function resolveCtx(ctx?: BijouContext): BijouContext {
  if (ctx) return ctx;
  return getDefaultContext();
}

/**
 * Compute the visible display width of a string in terminal columns.
 * Delegates to `graphemeWidth` which handles ANSI escapes and wide characters.
 *
 * @param str - The string to measure.
 * @returns The visible column width.
 */
function visibleLength(str: string): number {
  return graphemeWidth(str);
}

/**
 * Truncate a label to fit within a maximum visible width.
 * Strips ANSI escapes before measuring, truncates by grapheme cluster,
 * and appends an ellipsis character when truncation occurs.
 *
 * @param text - The label text to truncate.
 * @param maxLen - Maximum visible width in terminal columns.
 * @returns The possibly truncated label string.
 */
function truncateLabel(text: string, maxLen: number): string {
  if (maxLen <= 0) return '';
  if (visibleLength(text) <= maxLen) return text;
  // Truncate by grapheme clusters, not code units
  const clean = text.replace(/\x1b\[[0-9;]*m/g, '');
  const graphemes = segmentGraphemes(clean);
  let width = 0;
  let result = '';
  for (const g of graphemes) {
    const gw = graphemeWidth(g);
    if (width + gw > maxLen - 1) break;
    result += g;
    width += gw;
  }
  return result + '\u2026';
}

// ── Layout: Layer Assignment ───────────────────────────────────────

/**
 * Assign each node to a layer using longest-path layer assignment.
 *
 * Performs Kahn's topological sort to detect cycles, then assigns each
 * node to the layer one past its deepest parent. Root nodes (in-degree 0)
 * are placed on layer 0.
 *
 * @param nodes - The graph nodes to lay out.
 * @returns Map from node ID to its zero-based layer index.
 * @throws If the graph contains a cycle.
 */
function assignLayers(nodes: DagNode[]): Map<string, number> {
  const children = new Map<string, string[]>();
  const parents = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  const nodeIds = new Set(nodes.map(n => n.id));

  for (const n of nodes) {
    // Filter edges to only include targets that exist in the graph
    children.set(n.id, (n.edges ?? []).filter(e => nodeIds.has(e)));
    inDegree.set(n.id, 0);
    if (!parents.has(n.id)) parents.set(n.id, []);
  }

  for (const n of nodes) {
    for (const childId of children.get(n.id) ?? []) {
      if (!parents.has(childId)) parents.set(childId, []);
      parents.get(childId)!.push(n.id);
      inDegree.set(childId, (inDegree.get(childId) ?? 0) + 1);
    }
  }

  // Kahn's topological sort
  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const topoOrder: string[] = [];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    topoOrder.push(id);
    for (const childId of children.get(id) ?? []) {
      const newDeg = (inDegree.get(childId) ?? 1) - 1;
      inDegree.set(childId, newDeg);
      if (newDeg === 0) queue.push(childId);
    }
  }

  if (topoOrder.length !== nodes.length) {
    throw new Error('[bijou] dag(): cycle detected in graph');
  }

  // Longest-path layer assignment
  const layerMap = new Map<string, number>();
  for (const id of topoOrder) {
    const pars = parents.get(id) ?? [];
    if (pars.length === 0) {
      layerMap.set(id, 0);
    } else {
      let maxParent = 0;
      for (const p of pars) {
        maxParent = Math.max(maxParent, layerMap.get(p) ?? 0);
      }
      layerMap.set(id, maxParent + 1);
    }
  }

  return layerMap;
}

// ── Layout: Column Ordering ────────────────────────────────────────

/**
 * Group node IDs into layer arrays indexed by layer number.
 *
 * @param nodes - All graph nodes.
 * @param layerMap - Map from node ID to layer index (from `assignLayers`).
 * @returns Array of layers, where each layer is an array of node IDs.
 */
function buildLayerArrays(
  nodes: DagNode[],
  layerMap: Map<string, number>,
): string[][] {
  let maxLayer = 0;
  for (const v of layerMap.values()) {
    if (v > maxLayer) maxLayer = v;
  }
  const layers: string[][] = Array.from({ length: maxLayer + 1 }, () => []);
  for (const n of nodes) {
    const l = layerMap.get(n.id);
    if (l !== undefined) layers[l]!.push(n.id);
  }
  return layers;
}

/**
 * Reorder nodes within each layer to minimize edge crossings.
 *
 * Uses the barycenter heuristic with one top-down pass followed by
 * one bottom-up pass. Mutates the `layers` arrays in place.
 *
 * @param layers - Layer arrays from `buildLayerArrays`, mutated in place.
 * @param nodes - All graph nodes (used to build adjacency maps).
 */
function orderColumns(layers: string[][], nodes: DagNode[]): void {
  const childrenMap = new Map<string, string[]>();
  const parentsMap = new Map<string, string[]>();
  for (const n of nodes) {
    childrenMap.set(n.id, n.edges ?? []);
    if (!parentsMap.has(n.id)) parentsMap.set(n.id, []);
  }
  for (const n of nodes) {
    for (const c of n.edges ?? []) {
      if (!parentsMap.has(c)) parentsMap.set(c, []);
      parentsMap.get(c)!.push(n.id);
    }
  }

  // Top-down pass
  for (let l = 1; l < layers.length; l++) {
    const prevLayer = layers[l - 1]!;
    const curLayer = layers[l]!;
    const prevIndex = new Map<string, number>();
    for (let i = 0; i < prevLayer.length; i++) {
      prevIndex.set(prevLayer[i]!, i);
    }

    const bary = new Map<string, number>();
    for (const id of curLayer) {
      const pars = (parentsMap.get(id) ?? []).filter(p => prevIndex.has(p));
      if (pars.length === 0) {
        bary.set(id, Infinity);
      } else {
        const avg = pars.reduce((s, p) => s + (prevIndex.get(p) ?? 0), 0) / pars.length;
        bary.set(id, avg);
      }
    }
    curLayer.sort((a, b) => (bary.get(a) ?? Infinity) - (bary.get(b) ?? Infinity));
  }

  // Bottom-up pass
  for (let l = layers.length - 2; l >= 0; l--) {
    const nextLayer = layers[l + 1]!;
    const curLayer = layers[l]!;
    const nextIndex = new Map<string, number>();
    for (let i = 0; i < nextLayer.length; i++) {
      nextIndex.set(nextLayer[i]!, i);
    }

    const bary = new Map<string, number>();
    for (const id of curLayer) {
      const chlds = (childrenMap.get(id) ?? []).filter(c => nextIndex.has(c));
      if (chlds.length === 0) {
        bary.set(id, Infinity);
      } else {
        const avg = chlds.reduce((s, c) => s + (nextIndex.get(c) ?? 0), 0) / chlds.length;
        bary.set(id, avg);
      }
    }
    curLayer.sort((a, b) => (bary.get(a) ?? Infinity) - (bary.get(b) ?? Infinity));
  }
}

// ── Edge Routing ───────────────────────────────────────────────────

/** Cardinal direction for edge routing through grid cells. */
type Dir = 'U' | 'D' | 'L' | 'R';

/**
 * Lookup table mapping sorted direction-set keys to Unicode box-drawing characters.
 * For example, `'DR'` maps to `\u250c` (top-left corner).
 */
const JUNCTION: Record<string, string> = {
  'D': '\u2502', 'U': '\u2502', 'DU': '\u2502',
  'L': '\u2500', 'R': '\u2500', 'LR': '\u2500',
  'DR': '\u250c', 'DL': '\u2510', 'RU': '\u2514', 'LU': '\u2518',
  'DRU': '\u251c', 'DLU': '\u2524', 'DLR': '\u252c', 'LRU': '\u2534',
  'DLRU': '\u253c',
};

/**
 * Select the Unicode box-drawing character for a cell based on its edge directions.
 *
 * @param dirs - Set of cardinal directions passing through this cell.
 * @returns The appropriate box-drawing character, or `\u253c` (cross) as fallback.
 */
function junctionChar(dirs: Set<Dir>): string {
  const key = [...dirs].sort().join('');
  return JUNCTION[key] ?? '\u253c';
}

/**
 * Mutable grid state used during edge routing.
 *
 * Each cell tracks which cardinal directions edges pass through it,
 * and `arrows` records the encoded positions of arrowheads.
 */
interface GridState {
  /** 2D array of direction sets, one per grid cell. */
  dirs: Set<Dir>[][];
  /** Encoded arrowhead positions as `row * 10000 + col`. */
  arrows: Set<number>;
  /** Number of rows in the grid. */
  rows: number;
  /** Number of columns in the grid. */
  cols: number;
}

/**
 * Allocate an empty edge-routing grid.
 *
 * @param rows - Number of rows in the grid.
 * @param cols - Number of columns in the grid.
 * @returns A fresh `GridState` with empty direction sets for every cell.
 */
function createGrid(rows: number, cols: number): GridState {
  const dirs: Set<Dir>[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: Set<Dir>[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(new Set<Dir>());
    }
    dirs.push(row);
  }
  return { dirs, arrows: new Set<number>(), rows, cols };
}

/**
 * Add direction markers to a single grid cell. Bounds-checked.
 *
 * @param g - The grid state to mutate.
 * @param r - Row index.
 * @param c - Column index.
 * @param ds - One or more directions to mark in this cell.
 */
function markDir(g: GridState, r: number, c: number, ...ds: Dir[]): void {
  if (r >= 0 && r < g.rows && c >= 0 && c < g.cols) {
    const cell = g.dirs[r]![c]!;
    for (const d of ds) cell.add(d);
  }
}

/**
 * Route a single edge through the grid between two node positions.
 *
 * Draws a vertical segment from the source, an optional horizontal jog
 * if the columns differ, then a vertical segment down to the target.
 * Records an arrowhead position just above the destination node.
 *
 * @param g - The grid state to mutate.
 * @param fromCol - Column index of the source node.
 * @param fromLayer - Layer index of the source node.
 * @param toCol - Column index of the destination node.
 * @param toLayer - Layer index of the destination node.
 * @param RS - Row stride (number of grid rows per layer).
 * @param colCenter - Function mapping a column index to its center grid column.
 */
function markEdge(
  g: GridState,
  fromCol: number,
  fromLayer: number,
  toCol: number,
  toLayer: number,
  RS: number,
  colCenter: (c: number) => number,
): void {
  const srcC = colCenter(fromCol);
  const dstC = colCenter(toCol);
  const sRow = fromLayer * RS + 3;
  const dRow = toLayer * RS - 1;   // one row above dest box
  const mid = sRow + 1;

  if (srcC === dstC) {
    for (let r = sRow; r < dRow; r++) markDir(g, r, srcC, 'D', 'U');
  } else {
    markDir(g, sRow, srcC, 'D', 'U');
    markDir(g, mid, srcC, srcC < dstC ? 'R' : 'L', 'U');

    const minC = Math.min(srcC, dstC);
    const maxC = Math.max(srcC, dstC);
    for (let c = minC + 1; c < maxC; c++) markDir(g, mid, c, 'L', 'R');

    markDir(g, mid, dstC, srcC < dstC ? 'L' : 'R', 'D');
    for (let r = mid + 1; r < dRow; r++) markDir(g, r, dstC, 'D', 'U');
  }

  g.arrows.add(dRow * 10000 + dstC);
}

// ── Node Box Rendering ─────────────────────────────────────────────

/** Classification of a character within a rendered node box, used for per-character styling. */
type CharType = 'border' | 'label' | 'badge' | 'pad';

/**
 * Result of rendering a single node box.
 *
 * Contains the raw character lines and a parallel array of per-character
 * type classifications for applying differential style tokens.
 */
interface NodeBoxResult {
  /** The three rendered lines: top border, content, bottom border. */
  lines: string[];
  /** Per-character type classification for each line, aligned with `lines`. */
  charTypes: CharType[][];
}

/**
 * Render a single node as a three-line Unicode box.
 *
 * Ghost nodes use dashed borders. The label is truncated to fit and a
 * badge (if present) is right-aligned within the box.
 *
 * @param label - The node label text.
 * @param badgeText - Optional badge text displayed to the right of the label.
 * @param width - Total character width of the box (including borders).
 * @param ghost - Whether to render with dashed (ghost) border characters.
 * @returns The rendered box lines and per-character type map.
 */
function renderNodeBox(
  label: string,
  badgeText: string | undefined,
  width: number,
  ghost: boolean,
): NodeBoxResult {
  const h = ghost ? '\u254c' : '\u2500';
  const v = ghost ? '\u254e' : '\u2502';

  const innerW = width - 2;
  const contentW = innerW - 2;

  let content: string;
  let midTypes: CharType[];
  if (badgeText) {
    const maxLabelW = contentW - visibleLength(badgeText) - 1;
    const tLabel = truncateLabel(label, maxLabelW);
    const gap = Math.max(1, contentW - visibleLength(tLabel) - visibleLength(badgeText));
    content = tLabel + ' '.repeat(gap) + badgeText;

    // Build char-type map for mid line: border + pad + label + gap + badge + pad + border
    // Use segmentGraphemes for correct grapheme cluster counting.
    midTypes = ['border']; // v
    midTypes.push('pad');  // space
    for (let i = 0; i < segmentGraphemes(tLabel).length; i++) midTypes.push('label');
    for (let i = 0; i < gap; i++) midTypes.push('pad');
    for (let i = 0; i < segmentGraphemes(badgeText).length; i++) midTypes.push('badge');
  } else {
    content = truncateLabel(label, contentW);

    // Build char-type map for mid line: border + pad + label + pad + border
    midTypes = ['border']; // v
    midTypes.push('pad');  // space
    for (let i = 0; i < segmentGraphemes(content).length; i++) midTypes.push('label');
  }

  const padRight = Math.max(0, contentW - visibleLength(content));
  for (let i = 0; i < padRight; i++) midTypes.push('pad');
  midTypes.push('pad');    // trailing space
  midTypes.push('border'); // v

  const top = '\u256d' + h.repeat(innerW) + '\u256e';
  const mid = v + ' ' + content + ' '.repeat(padRight) + ' ' + v;
  const bot = '\u2570' + h.repeat(innerW) + '\u256f';

  const borderLine: CharType[] = Array.from({ length: width }, () => 'border');

  return {
    lines: [top, mid, bot],
    charTypes: [borderLine, midTypes, borderLine],
  };
}

// ── Interactive Renderer ───────────────────────────────────────────

/**
 * Render the full interactive (styled) DAG layout.
 *
 * Performs the complete layout pipeline: layer assignment, column ordering,
 * edge routing, node box rendering, highlight/selection styling, and ANSI
 * serialization into a final string.
 *
 * @param nodes - The graph nodes to render.
 * @param options - Rendering options (tokens, selection, sizing).
 * @param ctx - The resolved bijou context.
 * @returns The rendered output string, node position map, and grid dimensions.
 */
function renderInteractiveLayout(
  nodes: DagNode[],
  options: DagOptions,
  ctx: BijouContext,
): { output: string; nodes: Map<string, DagNodePosition>; width: number; height: number } {
  if (nodes.length === 0) return { output: '', nodes: new Map(), width: 0, height: 0 };

  const nodeMap = new Map<string, DagNode>();
  for (const n of nodes) nodeMap.set(n.id, n);

  const layerMap = assignLayers(nodes);
  const layers = buildLayerArrays(nodes, layerMap);
  orderColumns(layers, nodes);

  const colIndex = new Map<string, number>();
  for (const layer of layers) {
    for (let i = 0; i < layer.length; i++) {
      colIndex.set(layer[i]!, i);
    }
  }

  let maxNodesPerLayer = 1;
  for (const layer of layers) {
    if (layer.length > maxNodesPerLayer) maxNodesPerLayer = layer.length;
  }
  const maxWidth = options.maxWidth ?? ctx.runtime.columns;

  let nodeWidth = options.nodeWidth ?? Math.max(
    ...nodes.map(n => visibleLength(n.label) + (n.badge ? visibleLength(n.badge) + 2 : 0) + 4),
    16,
  );

  let gap = 4;
  let colStride = nodeWidth + gap;
  let totalWidth = maxNodesPerLayer * colStride;

  if (totalWidth > maxWidth && !options.nodeWidth) {
    gap = 2;
    colStride = nodeWidth + gap;
    totalWidth = maxNodesPerLayer * colStride;
  }
  if (totalWidth > maxWidth && !options.nodeWidth) {
    nodeWidth = Math.max(16, Math.floor((maxWidth - gap) / maxNodesPerLayer) - gap);
    colStride = nodeWidth + gap;
    totalWidth = maxNodesPerLayer * colStride;
  }

  const RS = 6;
  const gridRows = layers.length * RS;
  const gridCols = totalWidth;
  const colCenter = (c: number): number => c * colStride + Math.floor(nodeWidth / 2);

  const g = createGrid(gridRows, gridCols);

  // Mark edges
  for (const n of nodes) {
    const fLayer = layerMap.get(n.id);
    const fCol = colIndex.get(n.id);
    if (fLayer === undefined || fCol === undefined) continue;
    for (const childId of n.edges ?? []) {
      const tLayer = layerMap.get(childId);
      const tCol = colIndex.get(childId);
      if (tLayer === undefined || tCol === undefined) continue;
      markEdge(g, fCol, fLayer, tCol, tLayer, RS, colCenter);
    }
  }

  // Build output grids
  const charGrid: string[][] = [];
  const tokenGrid: (TokenValue | null)[][] = [];
  for (let r = 0; r < gridRows; r++) {
    const charRow: string[] = [];
    const tokenRow: (TokenValue | null)[] = [];
    for (let c = 0; c < gridCols; c++) {
      charRow.push(' ');
      tokenRow.push(null);
    }
    charGrid.push(charRow);
    tokenGrid.push(tokenRow);
  }

  // Write edge characters
  const edgeToken = options.edgeToken ?? ctx.theme.theme.border.muted;
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const cell = g.dirs[r]![c]!;
      if (cell.size > 0) {
        charGrid[r]![c] = junctionChar(cell);
        tokenGrid[r]![c] = edgeToken;
      }
    }
  }

  // Write arrowheads
  for (const encoded of g.arrows) {
    const r = Math.floor(encoded / 10000);
    const c = encoded % 10000;
    if (r >= 0 && r < gridRows && c >= 0 && c < gridCols) {
      charGrid[r]![c] = '\u25bc';
      tokenGrid[r]![c] = edgeToken;
    }
  }

  // Highlight edges
  const highlightSet = new Set(options.highlightPath ?? []);
  if (options.highlightPath && options.highlightToken) {
    const hlToken = options.highlightToken;
    const path = options.highlightPath;
    for (let i = 0; i < path.length - 1; i++) {
      const fromId = path[i]!;
      const toId = path[i + 1]!;
      const fLayer = layerMap.get(fromId);
      const tLayer = layerMap.get(toId);
      const fCol = colIndex.get(fromId);
      const tCol = colIndex.get(toId);
      if (fLayer === undefined || tLayer === undefined || fCol === undefined || tCol === undefined) continue;

      const srcC = colCenter(fCol);
      const dstC = colCenter(tCol);
      const sRow = fLayer * RS + 3;
      const dRow = tLayer * RS - 1;
      const midRow = sRow + 1;

      if (srcC === dstC) {
        for (let r = sRow; r <= dRow && r < gridRows; r++) {
          if (srcC < gridCols) tokenGrid[r]![srcC] = hlToken;
        }
      } else {
        if (sRow < gridRows && srcC < gridCols) tokenGrid[sRow]![srcC] = hlToken;
        const minC = Math.min(srcC, dstC);
        const maxC2 = Math.max(srcC, dstC);
        if (midRow < gridRows) {
          for (let c = minC; c <= maxC2 && c < gridCols; c++) {
            tokenGrid[midRow]![c] = hlToken;
          }
        }
        for (let r = midRow; r <= dRow && r < gridRows; r++) {
          if (dstC < gridCols) tokenGrid[r]![dstC] = hlToken;
        }
      }
    }
  }

  // Write node boxes
  const positions = new Map<string, DagNodePosition>();
  for (const n of nodes) {
    const layer = layerMap.get(n.id);
    const col = colIndex.get(n.id);
    if (layer === undefined || col === undefined) continue;
    const startCol = col * colStride;
    const startRow = layer * RS;

    positions.set(n.id, { row: startRow, col: startCol, width: nodeWidth, height: 3 });

    const box = renderNodeBox(n.label, n.badge, nodeWidth, n._ghost === true);

    let nToken: TokenValue;
    if (options.selectedId === n.id) {
      nToken = options.selectedToken ?? ctx.theme.theme.ui.cursor;
    } else if (highlightSet.has(n.id) && options.highlightToken) {
      nToken = options.highlightToken;
    } else if (n.token) {
      nToken = n.token;
    } else {
      nToken = options.nodeToken ?? ctx.theme.theme.border.primary;
    }

    for (let lineIdx = 0; lineIdx < box.lines.length; lineIdx++) {
      const row = startRow + lineIdx;
      if (row >= gridRows) continue;
      const line = box.lines[lineIdx]!;
      const types = box.charTypes[lineIdx]!;
      const chars = segmentGraphemes(line);
      for (let ci = 0; ci < chars.length; ci++) {
        const gc = startCol + ci;
        if (gc < gridCols) {
          charGrid[row]![gc] = chars[ci]!;
          const charType = types[ci];
          if (charType === 'label' && n.labelToken) {
            tokenGrid[row]![gc] = n.labelToken;
          } else if (charType === 'badge' && n.badgeToken) {
            tokenGrid[row]![gc] = n.badgeToken;
          } else {
            tokenGrid[row]![gc] = nToken;
          }
        }
      }
    }
  }

  // Serialize
  const lines: string[] = [];
  for (let r = 0; r < gridRows; r++) {
    let line = '';
    let prevToken: TokenValue | null = null;
    let run = '';

    for (let c = 0; c < gridCols; c++) {
      const ch = charGrid[r]![c]!;
      const tk = tokenGrid[r]![c]!;

      if (tk === prevToken || (tk === null && prevToken === null)) {
        run += ch;
      } else {
        if (run) {
          line += prevToken ? ctx.style.styled(prevToken, run) : run;
        }
        run = ch;
        prevToken = tk;
      }
    }
    if (run) {
      line += prevToken ? ctx.style.styled(prevToken, run) : run;
    }
    lines.push(line.replace(/\s+$/, ''));
  }

  while (lines.length > 0 && lines[lines.length - 1]!.trim() === '') {
    lines.pop();
  }

  return { output: lines.join('\n'), nodes: positions, width: gridCols, height: gridRows };
}

// ── Pipe Renderer ──────────────────────────────────────────────────

/**
 * Render the graph as plain text for piped (non-TTY) output.
 *
 * Produces one line per node in the format `Label -> Target1, Target2`
 * with no ANSI styling or box-drawing characters.
 *
 * @param nodes - The graph nodes to render.
 * @returns Plain text representation of the graph.
 */
function renderPipe(nodes: DagNode[]): string {
  if (nodes.length === 0) return '';
  const lines: string[] = [];
  for (const n of nodes) {
    const edges = n.edges ?? [];
    const badgePart = n.badge ? ` (${n.badge})` : '';
    if (edges.length > 0) {
      const targets = edges
        .map(id => {
          const target = nodes.find(t => t.id === id);
          return target ? target.label : id;
        })
        .join(', ');
      lines.push(`${n.label}${badgePart} -> ${targets}`);
    } else {
      lines.push(`${n.label}${badgePart}`);
    }
  }
  return lines.join('\n');
}

// ── Accessible Renderer ────────────────────────────────────────────

/**
 * Render the graph as structured accessible text.
 *
 * Produces a summary header ("Graph: N nodes, M edges") followed by
 * layer-grouped node listings with edge descriptions.
 *
 * @param nodes - The graph nodes to render.
 * @param layerMap - Map from node ID to layer index.
 * @returns Accessible text representation of the graph.
 */
function renderAccessible(nodes: DagNode[], layerMap: Map<string, number>): string {
  if (nodes.length === 0) return 'Graph: 0 nodes, 0 edges';

  const totalEdges = nodes.reduce((s, n) => s + (n.edges?.length ?? 0), 0);
  const lines: string[] = [`Graph: ${nodes.length} nodes, ${totalEdges} edges`, ''];

  const layers = buildLayerArrays(nodes, layerMap);
  const nodeMap = new Map<string, DagNode>();
  for (const n of nodes) nodeMap.set(n.id, n);

  for (let l = 0; l < layers.length; l++) {
    lines.push(`Layer ${l + 1}:`);
    for (const id of layers[l]!) {
      const n = nodeMap.get(id);
      if (!n) continue;
      const badgePart = n.badge ? ` (${n.badge})` : '';
      const edges = (n.edges ?? []).filter(e => nodeMap.has(e));
      if (edges.length > 0) {
        const targets = edges.map(e => nodeMap.get(e)?.label ?? e).join(', ');
        lines.push(`  ${n.label}${badgePart} -> ${targets}`);
      } else {
        lines.push(`  ${n.label}${badgePart} (end)`);
      }
    }
    lines.push('');
  }

  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  return lines.join('\n');
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
  nodes: DagNode[],
  focus: string,
  opts?: DagSliceOptions,
): DagNode[];
export function dagSlice(
  input: DagNode[] | DagSource,
  focus: string,
  opts?: DagSliceOptions,
): DagNode[] | SlicedDagSource {
  if (isDagSource(input)) {
    return sliceSource(input, focus, opts);
  }
  // Array path: wrap, slice, materialize back for backward compat
  const source = arraySource(input);
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
export function dagLayout(nodes: DagNode[], options?: DagOptions): DagLayout;
export function dagLayout(
  input: DagNode[] | SlicedDagSource,
  options: DagOptions = {},
): DagLayout {
  if (isDagSource(input) && !isSlicedDagSource(input)) {
    throw new Error(
      '[bijou] dagLayout(): received an unbounded DagSource. Use dagSlice() to produce a SlicedDagSource first.',
    );
  }
  const ctx = resolveCtx(options.ctx);
  const nodes = isSlicedDagSource(input) ? materialize(input) : input;
  if (nodes.length === 0) return { output: '', nodes: new Map(), width: 0, height: 0 };
  const result = renderInteractiveLayout(nodes, options, ctx);
  return { output: result.output, nodes: result.nodes, width: result.width, height: result.height };
}

// ── Main Entry Point ───────────────────────────────────────────────

/**
 * Render a directed acyclic graph as a styled string.
 *
 * Adapts output to the current context mode:
 * - `'interactive'`: Unicode box-drawing with ANSI styling.
 * - `'pipe'`: Plain text `Label -> Target` lines.
 * - `'accessible'`: Structured text with layer groupings.
 *
 * @param input - A `SlicedDagSource` or `DagNode[]` to render.
 * @param options - Rendering options (tokens, selection, sizing).
 * @returns The rendered graph string.
 * @throws If given an unbounded `DagSource` (must call `dagSlice()` first).
 */
export function dag(source: SlicedDagSource, options?: DagOptions): string;
export function dag(nodes: DagNode[], options?: DagOptions): string;
export function dag(
  input: DagNode[] | SlicedDagSource,
  options: DagOptions = {},
): string {
  if (isDagSource(input) && !isSlicedDagSource(input)) {
    throw new Error(
      '[bijou] dag(): received an unbounded DagSource. Use dagSlice() to produce a SlicedDagSource first.',
    );
  }
  const ctx = resolveCtx(options.ctx);
  const mode = ctx.mode;
  const nodes = isSlicedDagSource(input) ? materialize(input) : input;

  if (nodes.length === 0) return '';

  if (mode === 'pipe') {
    return renderPipe(nodes);
  }

  if (mode === 'accessible') {
    const layerMap = assignLayers(nodes);
    return renderAccessible(nodes, layerMap);
  }

  return renderInteractiveLayout(nodes, options, ctx).output;
}
