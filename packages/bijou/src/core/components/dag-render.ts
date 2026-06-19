/**
 * Rendering functions for the DAG component.
 *
 * Handles node box construction, interactive layout rendering with ANSI styling,
 * pipe-mode plain text output, and accessible structured text output.
 *
 * Imports types from `dag.ts` (type-only, erased at runtime).
 * Imports layout functions from `dag-layout.ts` and edge primitives from `dag-edges.ts`.
 */

import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import type { DagCompactShape, DagEdgeStyle, DagNode, DagNodePosition, DagNodeStyle, DagOptions } from './dag.js';
import { assignLayers, buildLayerArrays, orderColumns } from './dag-layout.js';
import { arrowChar, buildEdgeRoute, createGrid, markEdge, junctionChar, encodeArrowPos } from './dag-edges.js';
import type { GridState } from './dag-edges.js';
import { graphemeWidth, segmentGraphemes, stripAnsi } from '../text/grapheme.js';
import { sanitizeOptionalPositiveInt, sanitizePositiveInt } from '../numeric.js';

// ── Helpers ────────────────────────────────────────────────────────

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
  const clean = stripAnsi(text);
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

/**
 * Choose the horizontal gap between DAG columns for a given node width.
 *
 * Narrow node boxes benefit from tighter sibling spacing; wide boxes need
 * more separation so routed edges remain readable.
 */
function preferredColumnGap(nodeWidth: number): number {
  if (nodeWidth <= 5) return 1;
  if (nodeWidth <= 9) return 2;
  if (nodeWidth <= 13) return 3;
  return 4;
}

function nodeHeightForStyle(nodeStyle: DagNodeStyle): number {
  return nodeStyle === 'compact' ? 1 : 3;
}

function rowStrideForStyle(nodeStyle: DagNodeStyle): number {
  return nodeStyle === 'compact' ? 4 : 6;
}

function minimumRenderableNodeWidth(nodeStyle: DagNodeStyle): number {
  return nodeStyle === 'compact' ? 3 : 5;
}

function autoWidthFloor(nodeStyle: DagNodeStyle): number {
  return nodeStyle === 'compact' ? 3 : 16;
}

function minimumCanvasWidthForDetours(
  nodes: readonly DagNode[],
  layerMap: ReadonlyMap<string, number>,
  colIndex: ReadonlyMap<string, number>,
  layerWidths: readonly number[],
  nodeWidth: number,
): number {
  const detourOffset = Math.floor(nodeWidth / 2) + 1;
  let requiredWidth = 0;

  for (const node of nodes) {
    const fromLayer = layerMap.get(node.id);
    const fromCol = colIndex.get(node.id);
    if (fromLayer === undefined || fromCol === undefined) continue;
    for (const childId of node.edges ?? []) {
      const toLayer = layerMap.get(childId);
      const toCol = colIndex.get(childId);
      if (toLayer === undefined || toCol === undefined) continue;
      if (fromCol !== toCol || toLayer - fromLayer <= 1) continue;
      requiredWidth = Math.max(
        requiredWidth,
        (layerWidths[fromLayer] ?? 0) + detourOffset * 2,
        (layerWidths[toLayer] ?? 0) + detourOffset * 2,
      );
    }
  }

  return requiredWidth;
}

function compactDelimiters(shape: DagCompactShape): { open: string; close: string } {
  switch (shape) {
    case 'round': return { open: '(', close: ')' };
    case 'angle': return { open: '<', close: '>' };
    case 'brace': return { open: '{', close: '}' };
    case 'plain': return { open: '', close: '' };
    case 'square':
    default:
      return { open: '[', close: ']' };
  }
}

function combinedLabel(label: string, badgeText?: string): string {
  return badgeText ? `${label} ${badgeText}` : label;
}

function withBackground(token: TokenValue, bgToken?: TokenValue): TokenValue {
  if (!bgToken?.bg) return token;
  return {
    ...token,
    bg: bgToken.bg,
    bgRGB: bgToken.bgRGB ?? token.bgRGB,
  };
}

function buildCenteredRun(
  label: string,
  width: number,
  labelType: CharType,
): { content: string; types: CharType[] } {
  const text = truncateLabel(label, width);
  const remaining = Math.max(0, width - visibleLength(text));
  const left = Math.floor(remaining / 2);
  const right = remaining - left;
  const content = ' '.repeat(left) + text + ' '.repeat(right);
  const types: CharType[] = [];
  for (let i = 0; i < left; i++) types.push('pad');
  types.push(...segmentGraphemes(text).map(() => labelType));
  for (let i = 0; i < right; i++) types.push('pad');
  return { content, types };
}

function buildCenteredLabelAndBadge(
  label: string,
  badgeText: string | undefined,
  width: number,
): { content: string; types: CharType[] } {
  if (!badgeText) return buildCenteredRun(label, width, 'label');

  const maxLabelWidth = Math.max(1, width - visibleLength(badgeText) - 1);
  const truncatedLabel = truncateLabel(label, maxLabelWidth);
  const combined = `${truncatedLabel} ${badgeText}`;
  const remaining = Math.max(0, width - visibleLength(combined));
  const left = Math.floor(remaining / 2);
  const right = remaining - left;

  const types: CharType[] = [];
  for (let i = 0; i < left; i++) types.push('pad');
  types.push(...segmentGraphemes(truncatedLabel).map((): CharType => 'label'));
  types.push('pad');
  types.push(...segmentGraphemes(badgeText).map((): CharType => 'badge'));
  for (let i = 0; i < right; i++) types.push('pad');

  return {
    content: ' '.repeat(left) + combined + ' '.repeat(right),
    types,
  };
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
  /** The rendered lines for this node. */
  lines: string[];
  /** Per-character type classification for each line, aligned with `lines`. */
  charTypes: CharType[][];
  /** Rendered node height in rows. */
  height: number;
  /** Rendered node width in columns. */
  width: number;
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

  const centered = buildCenteredLabelAndBadge(label, badgeText, contentW);
  const content = centered.content;
  const midTypes: CharType[] = ['border', 'pad', ...centered.types, 'pad', 'border'];

  const top = '\u256d' + h.repeat(innerW) + '\u256e';
  const mid = v + ' ' + content + ' ' + v;
  const bot = '\u2570' + h.repeat(innerW) + '\u256f';

  const borderLine: CharType[] = Array.from({ length: width }, () => 'border');

  return {
    lines: [top, mid, bot],
    charTypes: [borderLine, midTypes, borderLine],
    height: 3,
    width,
  };
}

function renderCompactNode(
  label: string,
  badgeText: string | undefined,
  width: number,
  shape: DagCompactShape,
): NodeBoxResult {
  const { open, close } = compactDelimiters(shape);
  const contentWidth = Math.max(1, width - visibleLength(open) - visibleLength(close));
  const centered = buildCenteredLabelAndBadge(label, badgeText, contentWidth);
  const line = open + centered.content + close;
  const charTypes: CharType[] = [];
  charTypes.push(...segmentGraphemes(open).map((): CharType => 'border'));
  charTypes.push(...centered.types);
  charTypes.push(...segmentGraphemes(close).map((): CharType => 'border'));
  return {
    lines: [line],
    charTypes: [charTypes],
    height: 1,
    width,
  };
}

/**
 * Expand grapheme arrays so array index equals column offset.
 *
 * For each wide grapheme (width 2), insert a `''` placeholder in chars
 * and duplicate the type in types. After expansion, `chars[col]` and
 * `types[col]` are column-aligned.
 *
 * @param graphemes - Array of grapheme cluster strings to expand.
 * @param types - Parallel array of per-grapheme character type classifications.
 * @returns Column-aligned character and type arrays with wide-character placeholders inserted.
 */
function expandToColumns(
  graphemes: string[],
  types: CharType[],
): { chars: string[]; types: CharType[] } {
  const outChars: string[] = [];
  const outTypes: CharType[] = [];
  for (const [i, g] of graphemes.entries()) {
    const t = types[i] ?? 'pad';
    const w = graphemeWidth(g);
    outChars.push(g);
    outTypes.push(t);
    if (w === 2) {
      outChars.push('');
      outTypes.push(t);
    }
  }
  return { chars: outChars, types: outTypes };
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
export function renderInteractiveLayout(
  nodes: DagNode[],
  options: DagOptions,
  ctx: BijouContext,
): { output: string; nodes: Map<string, DagNodePosition>; width: number; height: number } {
  if (nodes.length === 0) return { output: '', nodes: new Map(), width: 0, height: 0 };

  const layerMap = assignLayers(nodes);
  const layers = buildLayerArrays(nodes, layerMap);
  orderColumns(layers, nodes);

  const colIndex = new Map<string, number>();
  for (const layer of layers) {
    for (const [i, id] of layer.entries()) {
      colIndex.set(id, i);
    }
  }

  const nodeStyle: DagNodeStyle = options.nodeStyle ?? 'box';
  const edgeStyle: DagEdgeStyle = options.edgeStyle ?? 'single';
  const nodeHeight = nodeHeightForStyle(nodeStyle);
  const rowStride = rowStrideForStyle(nodeStyle);
  const renderableMinWidth = minimumRenderableNodeWidth(nodeStyle);

  let maxNodesPerLayer = 1;
  for (const layer of layers) {
    if (layer.length > maxNodesPerLayer) maxNodesPerLayer = layer.length;
  }
  const maxWidth = sanitizePositiveInt(options.maxWidth, ctx.runtime.columns);
  const explicitNodeWidth = sanitizeOptionalPositiveInt(options.nodeWidth);
  const maxCompactChrome = nodes.reduce((max, n) => {
    const shape = n.compactShape ?? 'square';
    const { open, close } = compactDelimiters(shape);
    return Math.max(max, visibleLength(open) + visibleLength(close));
  }, 2);

  let nodeWidth = Math.max(
    explicitNodeWidth ?? nodes.reduce(
      (max, n) => Math.max(
        max,
        visibleLength(combinedLabel(n.label, nodeStyle === 'compact' ? n.badge : undefined))
          + (nodeStyle === 'compact' ? maxCompactChrome : (n.badge ? visibleLength(n.badge) + 4 : 4)),
      ),
      autoWidthFloor(nodeStyle),
    ),
    renderableMinWidth,
  );

  let gap = preferredColumnGap(nodeWidth);
  let colStride = nodeWidth + gap;
  let totalWidth = maxNodesPerLayer * nodeWidth + Math.max(0, maxNodesPerLayer - 1) * gap;

  if (totalWidth > maxWidth && explicitNodeWidth == null) {
    gap = Math.min(gap, 2);
    colStride = nodeWidth + gap;
    totalWidth = maxNodesPerLayer * nodeWidth + Math.max(0, maxNodesPerLayer - 1) * gap;
  }
  if (totalWidth > maxWidth && explicitNodeWidth == null) {
    nodeWidth = Math.max(
      autoWidthFloor(nodeStyle),
      Math.floor((maxWidth - Math.max(0, maxNodesPerLayer - 1) * gap) / maxNodesPerLayer),
    );
    colStride = nodeWidth + gap;
    totalWidth = maxNodesPerLayer * nodeWidth + Math.max(0, maxNodesPerLayer - 1) * gap;
  }

  const layerWidths = layers.map((layer) => layer.length === 0
    ? 0
    : layer.length * nodeWidth + Math.max(0, layer.length - 1) * gap);
  totalWidth = Math.max(
    layerWidths.reduce((max, width) => Math.max(max, width), 0),
    minimumCanvasWidthForDetours(nodes, layerMap, colIndex, layerWidths, nodeWidth),
  );
  const layerOffsets = layerWidths.map((width) => Math.max(0, Math.floor((totalWidth - width) / 2)));

  const gridRows = layers.length * rowStride;
  const gridCols = totalWidth;
  const colCenter = (layer: number, col: number): number => (layerOffsets[layer] ?? 0) + col * colStride + Math.floor(nodeWidth / 2);

  const g: GridState = createGrid(gridRows, gridCols);

  // Mark edges
  for (const n of nodes) {
    const fLayer = layerMap.get(n.id);
    const fCol = colIndex.get(n.id);
    if (fLayer === undefined || fCol === undefined) continue;
    for (const childId of n.edges ?? []) {
      const tLayer = layerMap.get(childId);
      const tCol = colIndex.get(childId);
      if (tLayer === undefined || tCol === undefined) continue;
      markEdge(g, fCol, fLayer, tCol, tLayer, rowStride, colCenter, nodeWidth, nodeHeight);
    }
  }

  // ── Build placed nodes + spatial index ────────────────────────────

  /** A node that has been positioned on the character grid. */
  interface PlacedNode {
    /** The starting row (0-indexed) of this node on the character grid. */
    startRow: number;
    /** The starting column (0-indexed) of this node on the character grid. */
    startCol: number;
    /** The width of the rendered node box in columns. */
    width: number;
    /** The raw rendered box lines and per-character type classifications. */
    box: NodeBoxResult;
    /** Column-expanded characters per line. */
    chars: string[][];
    /** Column-expanded type classifications per line. */
    charTypes: CharType[][];
    /** The resolved style token for this node. */
    borderToken: TokenValue;
    /** Optional background token applied behind the node. */
    padToken: TokenValue;
    /** The resolved style token for the node label. */
    labelToken: TokenValue;
    /** The resolved style token for the node badge. */
    badgeToken: TokenValue;
    /** Reference to the original DagNode. */
    node: DagNode;
  }

  const highlightSet = new Set(options.highlightPath ?? []);
  const edgeToken = options.edgeToken ?? ctx.border('muted');
  const hlToken = options.highlightToken;

  const positions = new Map<string, DagNodePosition>();
  const nodesByRow = new Map<number, PlacedNode[]>();

  for (const n of nodes) {
    const layer = layerMap.get(n.id);
    const col = colIndex.get(n.id);
    if (layer === undefined || col === undefined) continue;
    const box = nodeStyle === 'compact'
      ? renderCompactNode(
        n.label,
        n.badge,
        nodeWidth,
        n.compactShape ?? 'square',
      )
      : renderNodeBox(n.label, n.badge, nodeWidth, n._ghost === true);
    const startCol = (layerOffsets[layer] ?? 0) + col * colStride;
    const startRow = layer * rowStride;

    positions.set(n.id, { row: startRow, col: startCol, width: box.width, height: box.height });

    let baseBorderToken: TokenValue;
    if (options.selectedId === n.id) {
      baseBorderToken = options.selectedToken ?? ctx.ui('cursor');
    } else if (highlightSet.has(n.id) && hlToken) {
      baseBorderToken = hlToken;
    } else if (n.token) {
      baseBorderToken = n.token;
    } else {
      baseBorderToken = options.nodeToken ?? ctx.border('primary');
    }
    const bgToken = n.bgToken ?? options.nodeBgToken;
    const borderToken = withBackground(baseBorderToken, bgToken);
    const labelToken = withBackground(n.labelToken ?? baseBorderToken, bgToken);
    const badgeToken = withBackground(n.badgeToken ?? (n.labelToken ?? baseBorderToken), bgToken);
    const padToken = bgToken ?? borderToken;

    // Expand grapheme arrays to column-aligned arrays so cellAt can
    // index by column offset directly (handles CJK/wide characters).
    const expandedChars: string[][] = [];
    const expandedTypes: CharType[][] = [];
    for (const [lineIdx, line] of box.lines.entries()) {
      const graphemes = segmentGraphemes(line);
      const types = box.charTypes[lineIdx] ?? [];
      const { chars: ec, types: et } = expandToColumns(graphemes, types);
      expandedChars.push(ec);
      expandedTypes.push(et);
    }

    const placed: PlacedNode = {
      startRow, startCol, width: box.width, box,
      chars: expandedChars,
      charTypes: expandedTypes,
      borderToken,
      padToken,
      labelToken,
      badgeToken,
      node: n,
    };

    for (let lineIdx = 0; lineIdx < box.height; lineIdx++) {
      const row = startRow + lineIdx;
      if (row >= gridRows) continue;
      let list = nodesByRow.get(row);
      if (!list) { list = []; nodesByRow.set(row, list); }
      list.push(placed);
    }
  }

  // ── Build highlight edge cell set ───────────────────────────────

  const hlCells = new Set<number>();
  if (options.highlightPath && hlToken) {
    const path = options.highlightPath;
    for (let i = 0; i < path.length - 1; i++) {
      const fromId = path[i];
      const toId = path[i + 1];
      if (fromId === undefined || toId === undefined) continue;
      const fLayer = layerMap.get(fromId);
      const tLayer = layerMap.get(toId);
      const fCol = colIndex.get(fromId);
      const tCol = colIndex.get(toId);
      if (fLayer === undefined || tLayer === undefined || fCol === undefined || tCol === undefined) continue;
      const route = buildEdgeRoute(fCol, fLayer, tCol, tLayer, rowStride, colCenter, nodeWidth, nodeHeight, gridCols);
      for (const point of route.path) {
        if (point.row >= 0 && point.row < gridRows && point.col >= 0 && point.col < gridCols) {
          hlCells.add(encodeArrowPos(point.row, point.col));
        }
      }
    }
  }

  // ── cellAt: on-demand per-cell computation ──────────────────────

  /**
   * Resolve the character and optional style token at a grid coordinate.
   *
   * @param row - The grid row index.
   * @param col - The grid column index.
   * @returns The character at the coordinate and its associated style token (or null for unstyled).
   */
  function cellAt(row: number, col: number): { ch: string; token: TokenValue | null } {
    // 1. Node box (highest priority)
    const nodesOnRow = nodesByRow.get(row);
    if (nodesOnRow) {
      for (const p of nodesOnRow) {
        if (col >= p.startCol && col < p.startCol + p.width) {
          const lineIdx = row - p.startRow;
          const ci = col - p.startCol;
          const ch = p.chars[lineIdx]?.[ci] ?? ' ';
          const charType = p.charTypes[lineIdx]?.[ci] ?? 'pad';
          const token = charType === 'label'
            ? p.labelToken
            : charType === 'badge'
              ? p.badgeToken
              : charType === 'border'
                ? p.borderToken
                : p.padToken;
          return { ch, token };
        }
      }
    }

    // 2. Arrowhead
    const encoded = encodeArrowPos(row, col);
    const arrowCount = g.arrows.get(encoded) ?? 0;
    if (arrowCount > 0) {
      const token = hlCells.has(encoded) ? (hlToken ?? edgeToken) : edgeToken;
      return { ch: arrowChar(edgeStyle), token };
    }

    // 3. Edge
    const dirs = g.dirs[row]?.[col];
    if (dirs && dirs.size > 0) {
      const token = hlCells.has(encoded) ? (hlToken ?? edgeToken) : edgeToken;
      return { ch: junctionChar(dirs, edgeStyle), token };
    }

    // 4. Empty
    return { ch: ' ', token: null };
  }

  // ── Serialize: run-length grouping with cellAt queries ──────────

  const lines: string[] = [];
  for (let r = 0; r < gridRows; r++) {
    let line = '';
    let prevToken: TokenValue | null = null;
    let run = '';

    for (let c = 0; c < gridCols; c++) {
      const { ch, token: tk } = cellAt(r, c);

      // TokenValue is a plain object — reference equality works here because
      // the same token instance is reused for all cells of the same type.
      if (tk === prevToken) {
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

  while (lines.at(-1)?.trim() === '') {
    lines.pop();
  }

  return { output: lines.join('\n'), nodes: positions, width: gridCols, height: gridRows };
}

// ── Pipe Renderer ──────────────────────────────────────────────────

/**
 * Render the graph as plain text for piped (non-TTY) output.
 *
 * Produces one plain-text dependency line per rendered edge so multi-parent
 * and fan-out relationships remain explicit in linear output. Nodes with no
 * outgoing edges still render as standalone lines.
 *
 * @param nodes - The graph nodes to render.
 * @returns Plain text representation of the graph.
 */
export function renderPipe(nodes: DagNode[]): string {
  if (nodes.length === 0) return '';
  const labelById = new Map(nodes.map(n => [n.id, n.label] as const));
  const lines: string[] = [];
  for (const n of nodes) {
    const edges = n.edges ?? [];
    const badgePart = n.badge ? ` (${n.badge})` : '';
    if (edges.length > 0) {
      for (const id of edges) {
        lines.push(`${n.label}${badgePart} -> ${labelById.get(id) ?? id}`);
      }
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
export function renderAccessible(nodes: DagNode[], layerMap: Map<string, number>): string {
  if (nodes.length === 0) return 'Graph: 0 nodes, 0 edges';

  const layers = buildLayerArrays(nodes, layerMap);
  const nodeMap = new Map<string, DagNode>();
  for (const n of nodes) nodeMap.set(n.id, n);

  // Count only edges whose target exists in the graph (matching rendered output)
  const totalEdges = nodes.reduce((s, n) => s + (n.edges ?? []).filter(e => nodeMap.has(e)).length, 0);
  const lines: string[] = [`Graph: ${String(nodes.length)} nodes, ${String(totalEdges)} edges`, ''];

  for (const [layerIndex, layer] of layers.entries()) {
    lines.push(`Layer ${String(layerIndex + 1)}:`);
    for (const id of layer) {
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

  while (lines.at(-1) === '') lines.pop();
  return lines.join('\n');
}
