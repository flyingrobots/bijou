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
import type { DagNode, DagOptions, DagNodePosition } from './dag.js';
import { assignLayers, buildLayerArrays, orderColumns } from './dag-layout.js';
import { createGrid, markEdge, junctionChar, encodeArrowPos } from './dag-edges.js';
import type { GridState } from './dag-edges.js';
import { graphemeWidth, segmentGraphemes } from '../text/grapheme.js';

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
export function renderInteractiveLayout(
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
      markEdge(g, fCol, fLayer, tCol, tLayer, RS, colCenter);
    }
  }

  // ── Build placed nodes + spatial index ────────────────────────────

  interface PlacedNode {
    startRow: number;
    startCol: number;
    width: number;
    box: NodeBoxResult;
    chars: string[][];    // pre-segmented graphemes per line
    token: TokenValue;
    node: DagNode;
  }

  const highlightSet = new Set(options.highlightPath ?? []);
  const edgeToken = options.edgeToken ?? ctx.theme.theme.border.muted;
  const hlToken = options.highlightToken;

  const positions = new Map<string, DagNodePosition>();
  const nodesByRow = new Map<number, PlacedNode[]>();

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
    } else if (highlightSet.has(n.id) && hlToken) {
      nToken = hlToken;
    } else if (n.token) {
      nToken = n.token;
    } else {
      nToken = options.nodeToken ?? ctx.theme.theme.border.primary;
    }

    const placed: PlacedNode = {
      startRow, startCol, width: nodeWidth, box,
      chars: box.lines.map(line => segmentGraphemes(line)),
      token: nToken, node: n,
    };

    for (let lineIdx = 0; lineIdx < 3; lineIdx++) {
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
          if (srcC < gridCols) hlCells.add(encodeArrowPos(r, srcC));
        }
      } else {
        if (sRow < gridRows && srcC < gridCols) hlCells.add(encodeArrowPos(sRow, srcC));
        const minC = Math.min(srcC, dstC);
        const maxC2 = Math.max(srcC, dstC);
        if (midRow < gridRows) {
          for (let c = minC; c <= maxC2 && c < gridCols; c++) {
            hlCells.add(encodeArrowPos(midRow, c));
          }
        }
        for (let r = midRow; r <= dRow && r < gridRows; r++) {
          if (dstC < gridCols) hlCells.add(encodeArrowPos(r, dstC));
        }
      }
    }
  }

  // ── cellAt: on-demand per-cell computation ──────────────────────

  function cellAt(row: number, col: number): { ch: string; token: TokenValue | null } {
    // 1. Node box (highest priority)
    const nodesOnRow = nodesByRow.get(row);
    if (nodesOnRow) {
      for (const p of nodesOnRow) {
        if (col >= p.startCol && col < p.startCol + p.width) {
          const lineIdx = row - p.startRow;
          const ci = col - p.startCol;
          const ch = p.chars[lineIdx]![ci] ?? ' ';
          const charType = p.box.charTypes[lineIdx]![ci];
          let token: TokenValue;
          if (charType === 'label' && p.node.labelToken) {
            token = p.node.labelToken;
          } else if (charType === 'badge' && p.node.badgeToken) {
            token = p.node.badgeToken;
          } else {
            token = p.token;
          }
          return { ch, token };
        }
      }
    }

    // 2. Arrowhead
    const encoded = encodeArrowPos(row, col);
    if (g.arrows.has(encoded)) {
      const token = hlCells.has(encoded) ? hlToken! : edgeToken;
      return { ch: '\u25bc', token };
    }

    // 3. Edge
    const dirs = g.dirs[row]?.[col];
    if (dirs && dirs.size > 0) {
      const token = hlCells.has(encoded) ? hlToken! : edgeToken;
      return { ch: junctionChar(dirs), token };
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
export function renderPipe(nodes: DagNode[]): string {
  if (nodes.length === 0) return '';
  const labelById = new Map(nodes.map(n => [n.id, n.label] as const));
  const lines: string[] = [];
  for (const n of nodes) {
    const edges = n.edges ?? [];
    const badgePart = n.badge ? ` (${n.badge})` : '';
    if (edges.length > 0) {
      const targets = edges
        .map(id => labelById.get(id) ?? id)
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
export function renderAccessible(nodes: DagNode[], layerMap: Map<string, number>): string {
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
