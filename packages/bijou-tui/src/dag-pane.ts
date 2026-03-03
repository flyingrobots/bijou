/**
 * Interactive DAG pane building block.
 *
 * Composes `dagLayout()` with `focusArea()` to provide a scrollable,
 * keyboard-navigable DAG viewer with arrow-key node selection,
 * auto-scroll-to-selection, and auto-highlight-path.
 *
 * Follows the building block pattern: immutable state + pure transformers +
 * pure render + convenience keymap factory.
 *
 * ```ts
 * // In TEA init:
 * const pane = createDagPaneState({ source: nodes, width: 80, height: 24, ctx });
 *
 * // In TEA view:
 * const output = dagPane(pane, { focused: true, ctx });
 *
 * // In TEA update:
 * case 'select-child':
 *   return [{ ...model, pane: dagPaneSelectChild(model.pane, ctx) }, []];
 * ```
 */

import type { BijouContext, TokenValue, DagNode, DagNodePosition, DagLayout, DagOptions } from '@flyingrobots/bijou';
import { dagLayout, isSlicedDagSource } from '@flyingrobots/bijou';
import type { SlicedDagSource } from '@flyingrobots/bijou';
import {
  type FocusAreaState,
  type FocusAreaRenderOptions,
  type OverflowX,
  createFocusAreaState,
  focusArea,
  focusAreaScrollBy,
  focusAreaScrollToTop,
  focusAreaScrollToBottom,
  focusAreaPageDown,
  focusAreaPageUp,
  focusAreaScrollByX,
  focusAreaSetContent,
} from './focus-area.js';
import { scrollTo, scrollToX } from './viewport.js';
import { createKeyMap, type KeyMap } from './keybindings.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** DAG rendering options forwarded to `dagLayout()`. */
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

/** Immutable state for the DAG pane widget. */
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

/** Options for creating a new DAG pane state. */
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

/** Options for rendering the DAG pane view. */
export interface DagPaneRenderOptions extends FocusAreaRenderOptions {}

// ---------------------------------------------------------------------------
// Internal: Adjacency maps
// ---------------------------------------------------------------------------

interface Adjacency {
  /** Map from node ID to its child IDs. */
  children: ReadonlyMap<string, readonly string[]>;
  /** Map from node ID to its parent IDs. */
  parents: ReadonlyMap<string, readonly string[]>;
  /** Root nodes (no parents). */
  roots: readonly string[];
}

function buildAdjacency(source: DagNode[] | SlicedDagSource): Adjacency {
  const childMap = new Map<string, string[]>();
  const parentMap = new Map<string, string[]>();

  if (isSlicedDagSource(source)) {
    const ids = source.ids();
    const idSet = new Set(ids);
    for (const id of ids) {
      const children = source.children(id).filter((c) => idSet.has(c));
      childMap.set(id, [...children]);
      if (!parentMap.has(id)) parentMap.set(id, []);
      for (const child of children) {
        let parents = parentMap.get(child);
        if (!parents) {
          parents = [];
          parentMap.set(child, parents);
        }
        parents.push(id);
      }
    }
  } else {
    const idSet = new Set(source.map((n) => n.id));
    for (const node of source) {
      const children = (node.edges ?? []).filter((e) => idSet.has(e));
      childMap.set(node.id, children);
      if (!parentMap.has(node.id)) parentMap.set(node.id, []);
      for (const child of children) {
        let parents = parentMap.get(child);
        if (!parents) {
          parents = [];
          parentMap.set(child, parents);
        }
        parents.push(node.id);
      }
    }
  }

  const roots: string[] = [];
  for (const [id, parents] of parentMap) {
    if (parents.length === 0) roots.push(id);
  }
  // Also add any nodes that are in childMap but not parentMap (shouldn't happen, but safe)
  for (const id of childMap.keys()) {
    if (!parentMap.has(id)) roots.push(id);
  }

  return {
    children: childMap,
    parents: parentMap,
    roots,
  };
}

// ---------------------------------------------------------------------------
// Internal: Highlight path computation
// ---------------------------------------------------------------------------

function computeHighlightPath(
  selectedId: string | undefined,
  adjacency: Adjacency,
): readonly string[] {
  if (!selectedId) return [];

  // BFS upward from selected to find a root, then reverse
  const visited = new Set<string>();
  const cameFrom = new Map<string, string>();
  const queue: string[] = [selectedId];
  visited.add(selectedId);

  let rootFound: string | undefined;

  while (queue.length > 0) {
    const current = queue.shift()!;
    const parents = adjacency.parents.get(current) ?? [];
    if (parents.length === 0) {
      rootFound = current;
      break;
    }
    for (const parent of parents) {
      if (!visited.has(parent)) {
        visited.add(parent);
        cameFrom.set(parent, current);
        queue.push(parent);
      }
    }
  }

  if (rootFound === undefined) {
    // Selected node is itself a root (or disconnected)
    return [selectedId];
  }

  // Reconstruct path from root to selected
  const path: string[] = [];
  let cursor: string | undefined = rootFound;
  while (cursor !== undefined) {
    path.push(cursor);
    if (cursor === selectedId) break;
    cursor = cameFrom.get(cursor);
  }

  // If we couldn't reach selectedId from the root, just return selected
  if (path[path.length - 1] !== selectedId) {
    return [selectedId];
  }

  return path;
}

// ---------------------------------------------------------------------------
// Internal: Spatial navigation helpers
// ---------------------------------------------------------------------------

function closestByCol(
  candidates: readonly string[],
  currentCenter: number,
  positions: ReadonlyMap<string, DagNodePosition>,
): string | undefined {
  let best: string | undefined;
  let bestDist = Infinity;
  for (const id of candidates) {
    const pos = positions.get(id);
    if (!pos) continue;
    const center = pos.col + pos.width / 2;
    const dist = Math.abs(center - currentCenter);
    if (dist < bestDist) {
      bestDist = dist;
      best = id;
    }
  }
  return best;
}

function nodesOnSameRow(
  row: number,
  positions: ReadonlyMap<string, DagNodePosition>,
): string[] {
  const result: string[] = [];
  for (const [id, pos] of positions) {
    if (pos.row === row) result.push(id);
  }
  return result.sort((a, b) => {
    const pa = positions.get(a)!;
    const pb = positions.get(b)!;
    return pa.col - pb.col;
  });
}

// ---------------------------------------------------------------------------
// Internal: Auto-scroll to node
// ---------------------------------------------------------------------------

function scrollToNode(
  faState: FocusAreaState,
  nodePos: DagNodePosition,
): FocusAreaState {
  let scroll = faState.scroll;

  // Vertical: ensure node box (row .. row+height) is within viewport
  const nodeTop = nodePos.row;
  const nodeBottom = nodePos.row + nodePos.height - 1;
  const viewTop = scroll.y;
  const viewBottom = scroll.y + faState.height - 1;

  if (nodeTop < viewTop) {
    scroll = scrollTo(scroll, nodeTop);
  } else if (nodeBottom > viewBottom) {
    scroll = scrollTo(scroll, nodeBottom - faState.height + 1);
  }

  // Horizontal: ensure node box (col .. col+width) is within viewport
  if (faState.overflowX === 'scroll') {
    const contentWidth = Math.max(1, faState.width - 1); // minus gutter
    const nodeLeft = nodePos.col;
    const nodeRight = nodePos.col + nodePos.width - 1;
    const viewLeft = scroll.x;
    const viewRight = scroll.x + contentWidth - 1;

    if (nodeLeft < viewLeft) {
      scroll = scrollToX(scroll, nodeLeft);
    } else if (nodeRight > viewRight) {
      scroll = scrollToX(scroll, nodeRight - contentWidth + 1);
    }
  }

  return { ...faState, scroll };
}

// ---------------------------------------------------------------------------
// Internal: Selection update
// ---------------------------------------------------------------------------

function renderLayout(
  source: DagNode[] | SlicedDagSource,
  selectedId: string | undefined,
  highlightPath: readonly string[],
  dagOptions: DagPaneDagOptions,
  ctx?: BijouContext,
): DagLayout {
  const opts: DagOptions = {
    ...dagOptions,
    selectedId,
    highlightPath: highlightPath.length > 0 ? [...highlightPath] : undefined,
    ctx,
  };
  return dagLayout(source as DagNode[], opts);
}

function updateSelection(
  state: DagPaneState,
  newId: string | undefined,
  ctx?: BijouContext,
): DagPaneState {
  const adjacency = buildAdjacency(state.source);
  const highlightPath = computeHighlightPath(newId, adjacency);
  const layout = renderLayout(state.source, newId, highlightPath, state.dagOptions, ctx);
  let fa = focusAreaSetContent(state.focusArea, layout.output);

  // Auto-scroll to selected node
  if (newId) {
    const nodePos = layout.nodes.get(newId);
    if (nodePos) {
      fa = scrollToNode(fa, nodePos);
    }
  }

  return {
    ...state,
    selectedId: newId,
    highlightPath,
    layout,
    focusArea: fa,
  };
}

// ---------------------------------------------------------------------------
// State creation
// ---------------------------------------------------------------------------

/**
 * Create initial DAG pane state for the given source and dimensions.
 *
 * @param options - Source, dimensions, and rendering options.
 * @returns Fresh DAG pane state.
 */
export function createDagPaneState(options: DagPaneOptions): DagPaneState {
  const {
    source,
    width,
    height,
    selectedId,
    overflowX = 'scroll',
    dagOptions = {},
    ctx,
  } = options;

  const adjacency = buildAdjacency(source);
  const highlightPath = computeHighlightPath(selectedId, adjacency);
  const layout = renderLayout(source, selectedId, highlightPath, dagOptions, ctx);

  const fa = createFocusAreaState({
    content: layout.output,
    width,
    height,
    overflowX,
  });

  // Auto-scroll to initial selection
  let finalFa = fa;
  if (selectedId) {
    const nodePos = layout.nodes.get(selectedId);
    if (nodePos) {
      finalFa = scrollToNode(fa, nodePos);
    }
  }

  return {
    source,
    selectedId,
    layout,
    highlightPath,
    focusArea: finalFa,
    dagOptions,
  };
}

// ---------------------------------------------------------------------------
// Navigation transformers
// ---------------------------------------------------------------------------

/**
 * Select a child node (arrow down).
 * If nothing is selected, auto-selects the first root node.
 *
 * @param state - Current DAG pane state.
 * @param ctx - Bijou context for re-rendering.
 * @returns Updated state with new selection.
 */
export function dagPaneSelectChild(state: DagPaneState, ctx?: BijouContext): DagPaneState {
  const adjacency = buildAdjacency(state.source);

  if (!state.selectedId) {
    const firstRoot = adjacency.roots[0];
    return firstRoot ? updateSelection(state, firstRoot, ctx) : state;
  }

  const children = adjacency.children.get(state.selectedId) ?? [];
  if (children.length === 0) return state;

  const currentPos = state.layout.nodes.get(state.selectedId);
  const currentCenter = currentPos ? currentPos.col + currentPos.width / 2 : 0;
  const target = closestByCol(children, currentCenter, state.layout.nodes);
  return target ? updateSelection(state, target, ctx) : state;
}

/**
 * Select a parent node (arrow up).
 * If nothing is selected, auto-selects the first root node.
 *
 * @param state - Current DAG pane state.
 * @param ctx - Bijou context for re-rendering.
 * @returns Updated state with new selection.
 */
export function dagPaneSelectParent(state: DagPaneState, ctx?: BijouContext): DagPaneState {
  const adjacency = buildAdjacency(state.source);

  if (!state.selectedId) {
    const firstRoot = adjacency.roots[0];
    return firstRoot ? updateSelection(state, firstRoot, ctx) : state;
  }

  const parents = adjacency.parents.get(state.selectedId) ?? [];
  if (parents.length === 0) return state;

  const currentPos = state.layout.nodes.get(state.selectedId);
  const currentCenter = currentPos ? currentPos.col + currentPos.width / 2 : 0;
  const target = closestByCol(parents, currentCenter, state.layout.nodes);
  return target ? updateSelection(state, target, ctx) : state;
}

/**
 * Select the sibling node to the left in the same layer.
 * If nothing is selected, auto-selects the first root node.
 *
 * @param state - Current DAG pane state.
 * @param ctx - Bijou context for re-rendering.
 * @returns Updated state with new selection.
 */
export function dagPaneSelectLeft(state: DagPaneState, ctx?: BijouContext): DagPaneState {
  const adjacency = buildAdjacency(state.source);

  if (!state.selectedId) {
    const firstRoot = adjacency.roots[0];
    return firstRoot ? updateSelection(state, firstRoot, ctx) : state;
  }

  const currentPos = state.layout.nodes.get(state.selectedId);
  if (!currentPos) return state;

  const siblings = nodesOnSameRow(currentPos.row, state.layout.nodes);
  const idx = siblings.indexOf(state.selectedId);
  if (idx <= 0) return state; // already leftmost

  return updateSelection(state, siblings[idx - 1]!, ctx);
}

/**
 * Select the sibling node to the right in the same layer.
 * If nothing is selected, auto-selects the first root node.
 *
 * @param state - Current DAG pane state.
 * @param ctx - Bijou context for re-rendering.
 * @returns Updated state with new selection.
 */
export function dagPaneSelectRight(state: DagPaneState, ctx?: BijouContext): DagPaneState {
  const adjacency = buildAdjacency(state.source);

  if (!state.selectedId) {
    const firstRoot = adjacency.roots[0];
    return firstRoot ? updateSelection(state, firstRoot, ctx) : state;
  }

  const currentPos = state.layout.nodes.get(state.selectedId);
  if (!currentPos) return state;

  const siblings = nodesOnSameRow(currentPos.row, state.layout.nodes);
  const idx = siblings.indexOf(state.selectedId);
  if (idx < 0 || idx >= siblings.length - 1) return state; // already rightmost

  return updateSelection(state, siblings[idx + 1]!, ctx);
}

/**
 * Select a specific node by ID.
 * If the ID is not found in the layout, returns state unchanged (no selection).
 *
 * @param state - Current DAG pane state.
 * @param nodeId - ID of the node to select.
 * @param ctx - Bijou context for re-rendering.
 * @returns Updated state with new selection.
 */
export function dagPaneSelectNode(state: DagPaneState, nodeId: string, ctx?: BijouContext): DagPaneState {
  if (!state.layout.nodes.has(nodeId)) {
    return state;
  }
  return updateSelection(state, nodeId, ctx);
}

/**
 * Clear the current selection.
 *
 * @param state - Current DAG pane state.
 * @param ctx - Bijou context for re-rendering.
 * @returns Updated state with no selection.
 */
export function dagPaneClearSelection(state: DagPaneState, ctx?: BijouContext): DagPaneState {
  return updateSelection(state, undefined, ctx);
}

// ---------------------------------------------------------------------------
// Scroll transformers
// ---------------------------------------------------------------------------

/**
 * Scroll vertically by a relative amount.
 *
 * @param state - Current DAG pane state.
 * @param dy - Relative vertical offset (positive = down).
 * @returns Updated state.
 */
export function dagPaneScrollBy(state: DagPaneState, dy: number): DagPaneState {
  return { ...state, focusArea: focusAreaScrollBy(state.focusArea, dy) };
}

/**
 * Scroll to the top.
 *
 * @param state - Current DAG pane state.
 * @returns Updated state.
 */
export function dagPaneScrollToTop(state: DagPaneState): DagPaneState {
  return { ...state, focusArea: focusAreaScrollToTop(state.focusArea) };
}

/**
 * Scroll to the bottom.
 *
 * @param state - Current DAG pane state.
 * @returns Updated state.
 */
export function dagPaneScrollToBottom(state: DagPaneState): DagPaneState {
  return { ...state, focusArea: focusAreaScrollToBottom(state.focusArea) };
}

/**
 * Page down.
 *
 * @param state - Current DAG pane state.
 * @returns Updated state.
 */
export function dagPanePageDown(state: DagPaneState): DagPaneState {
  return { ...state, focusArea: focusAreaPageDown(state.focusArea) };
}

/**
 * Page up.
 *
 * @param state - Current DAG pane state.
 * @returns Updated state.
 */
export function dagPanePageUp(state: DagPaneState): DagPaneState {
  return { ...state, focusArea: focusAreaPageUp(state.focusArea) };
}

/**
 * Scroll horizontally by a relative amount.
 *
 * @param state - Current DAG pane state.
 * @param dx - Relative horizontal offset (positive = right).
 * @returns Updated state.
 */
export function dagPaneScrollByX(state: DagPaneState, dx: number): DagPaneState {
  return { ...state, focusArea: focusAreaScrollByX(state.focusArea, dx) };
}

/**
 * Replace the graph source and re-render. Clears selection.
 *
 * @param state - Current DAG pane state.
 * @param source - New graph data source.
 * @param ctx - Bijou context for re-rendering.
 * @returns Updated state with new source and cleared selection.
 */
export function dagPaneSetSource(
  state: DagPaneState,
  source: DagNode[] | SlicedDagSource,
  ctx?: BijouContext,
): DagPaneState {
  const highlightPath: readonly string[] = [];
  const layout = renderLayout(source, undefined, highlightPath, state.dagOptions, ctx);
  const fa = focusAreaSetContent(state.focusArea, layout.output);

  return {
    ...state,
    source,
    selectedId: undefined,
    highlightPath,
    layout,
    focusArea: fa,
  };
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/**
 * Render the DAG pane — focus area wrapping the DAG layout output.
 *
 * @param state - Current DAG pane state.
 * @param options - Rendering options (focus, tokens, scrollbar, ctx).
 * @returns Rendered DAG pane string.
 */
export function dagPane(state: DagPaneState, options?: DagPaneRenderOptions): string {
  return focusArea(state.focusArea, options);
}

// ---------------------------------------------------------------------------
// Convenience keymap
// ---------------------------------------------------------------------------

/**
 * Create a preconfigured KeyMap for DAG pane interaction.
 *
 * Arrow keys are bound to node selection. Vim keys (j/k/h/l) are bound
 * to scroll. `Enter` confirms, `q`/`Ctrl+C` quits.
 *
 * @template Msg - Application message type dispatched by key bindings.
 * @param actions - Map of actions to message values.
 * @returns Preconfigured key map with DAG pane bindings.
 */
export function dagPaneKeyMap<Msg>(actions: {
  selectParent: Msg;
  selectChild: Msg;
  selectLeft: Msg;
  selectRight: Msg;
  scrollUp: Msg;
  scrollDown: Msg;
  scrollLeft: Msg;
  scrollRight: Msg;
  pageUp: Msg;
  pageDown: Msg;
  top: Msg;
  bottom: Msg;
  confirm: Msg;
  quit: Msg;
}): KeyMap<Msg> {
  return createKeyMap<Msg>()
    .group('Selection', (g) => g
      .bind('up', 'Select parent', actions.selectParent)
      .bind('down', 'Select child', actions.selectChild)
      .bind('left', 'Select left', actions.selectLeft)
      .bind('right', 'Select right', actions.selectRight),
    )
    .group('Scroll', (g) => g
      .bind('j', 'Down', actions.scrollDown)
      .bind('k', 'Up', actions.scrollUp)
      .bind('h', 'Scroll left', actions.scrollLeft)
      .bind('l', 'Scroll right', actions.scrollRight)
      .bind('d', 'Page down', actions.pageDown)
      .bind('u', 'Page up', actions.pageUp)
      .bind('g', 'Top', actions.top)
      .bind('shift+g', 'Bottom', actions.bottom),
    )
    .bind('return', 'Confirm', actions.confirm)
    .bind('q', 'Quit', actions.quit)
    .bind('ctrl+c', 'Quit', actions.quit);
}
