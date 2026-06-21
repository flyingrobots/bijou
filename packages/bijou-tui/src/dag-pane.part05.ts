import type { BijouContext } from '@flyingrobots/bijou';

import { createFocusAreaState } from './focus-area.js';

import type { DagPaneOptions, DagPaneState } from './dag-pane.part01.js';

import { buildAdjacency } from './dag-pane.part02.js';

import { closestByCol, computeHighlightPath, nodesOnSameRow } from './dag-pane.part03.js';

import { renderLayout, scrollToNode, updateSelection } from './dag-pane.part04.js';
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

  // Validate selectedId — fall back to no selection if not in the source
  const validatedId = selectedId !== undefined && adjacency.children.has(selectedId) ? selectedId : undefined;

  const highlightPath = computeHighlightPath(validatedId, adjacency);
  const layout = renderLayout(source, validatedId, highlightPath, dagOptions, ctx);

  const fa = createFocusAreaState({
    content: layout.output,
    width,
    height,
    overflowX,
  });

  // Auto-scroll to initial selection
  let finalFa = fa;
  if (validatedId) {
    const nodePos = layout.nodes.get(validatedId);
    if (nodePos) {
      finalFa = scrollToNode(fa, nodePos);
    }
  }

  return {
    source,
    selectedId: validatedId,
    layout,
    highlightPath,
    focusArea: finalFa,
    dagOptions,
  };
}
export function dagPaneSelectChild(state: DagPaneState, ctx?: BijouContext): DagPaneState {
  const adjacency = buildAdjacency(state.source);

  if (!state.selectedId) {
    const firstRoot = adjacency.roots[0];
    return firstRoot ? updateSelection(state, firstRoot, adjacency, ctx) : state;
  }

  const children = adjacency.children.get(state.selectedId) ?? [];
  if (children.length === 0) return state;

  const currentPos = state.layout.nodes.get(state.selectedId);
  const currentCenter = currentPos ? currentPos.col + currentPos.width / 2 : 0;
  const target = closestByCol(children, currentCenter, state.layout.nodes);
  return target ? updateSelection(state, target, adjacency, ctx) : state;
}
export function dagPaneSelectParent(state: DagPaneState, ctx?: BijouContext): DagPaneState {
  const adjacency = buildAdjacency(state.source);

  if (!state.selectedId) {
    const firstRoot = adjacency.roots[0];
    return firstRoot ? updateSelection(state, firstRoot, adjacency, ctx) : state;
  }

  const parents = adjacency.parents.get(state.selectedId) ?? [];
  if (parents.length === 0) return state;

  const currentPos = state.layout.nodes.get(state.selectedId);
  const currentCenter = currentPos ? currentPos.col + currentPos.width / 2 : 0;
  const target = closestByCol(parents, currentCenter, state.layout.nodes);
  return target ? updateSelection(state, target, adjacency, ctx) : state;
}
export function dagPaneSelectLeft(state: DagPaneState, ctx?: BijouContext): DagPaneState {
  const adjacency = buildAdjacency(state.source);

  if (!state.selectedId) {
    const firstRoot = adjacency.roots[0];
    return firstRoot ? updateSelection(state, firstRoot, adjacency, ctx) : state;
  }

  const currentPos = state.layout.nodes.get(state.selectedId);
  if (!currentPos) return state;

  const siblings = nodesOnSameRow(currentPos.row, state.layout.nodes);
  const idx = siblings.indexOf(state.selectedId);
  if (idx <= 0) return state; // already leftmost

  return updateSelection(state, siblings[idx - 1], adjacency, ctx);
}
