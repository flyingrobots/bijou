import type { BijouContext, DagNode, SlicedDagSource } from '@flyingrobots/bijou';

import { focusArea, focusAreaPageDown, focusAreaPageUp, focusAreaScrollBy, focusAreaScrollByX, focusAreaScrollToBottom, focusAreaScrollToTop, focusAreaSetContent } from './focus-area.js';

import type { DagPaneRenderOptions, DagPaneState } from './dag-pane.part01.js';

import { buildAdjacency } from './dag-pane.part02.js';

import { nodesOnSameRow } from './dag-pane.part03.js';

import { renderLayout, updateSelection } from './dag-pane.part04.js';
export function dagPaneSelectRight(state: DagPaneState, ctx?: BijouContext): DagPaneState {
  const adjacency = buildAdjacency(state.source);

  if (!state.selectedId) {
    const firstRoot = adjacency.roots[0];
    return firstRoot ? updateSelection(state, firstRoot, adjacency, ctx) : state;
  }

  const currentPos = state.layout.nodes.get(state.selectedId);
  if (!currentPos) return state;

  const siblings = nodesOnSameRow(currentPos.row, state.layout.nodes);
  const idx = siblings.indexOf(state.selectedId);
  if (idx < 0 || idx >= siblings.length - 1) return state; // already rightmost

  return updateSelection(state, siblings[idx + 1], adjacency, ctx);
}
export function dagPaneSelectNode(state: DagPaneState, nodeId: string, ctx?: BijouContext): DagPaneState {
  if (!state.layout.nodes.has(nodeId)) {
    return state;
  }
  const adjacency = buildAdjacency(state.source);
  return updateSelection(state, nodeId, adjacency, ctx);
}
export function dagPaneClearSelection(state: DagPaneState, ctx?: BijouContext): DagPaneState {
  const adjacency = buildAdjacency(state.source);
  return updateSelection(state, undefined, adjacency, ctx);
}
export function dagPaneScrollBy(state: DagPaneState, dy: number): DagPaneState {
  return { ...state, focusArea: focusAreaScrollBy(state.focusArea, dy) };
}
export function dagPaneScrollToTop(state: DagPaneState): DagPaneState {
  return { ...state, focusArea: focusAreaScrollToTop(state.focusArea) };
}
export function dagPaneScrollToBottom(state: DagPaneState): DagPaneState {
  return { ...state, focusArea: focusAreaScrollToBottom(state.focusArea) };
}
export function dagPanePageDown(state: DagPaneState): DagPaneState {
  return { ...state, focusArea: focusAreaPageDown(state.focusArea) };
}
export function dagPanePageUp(state: DagPaneState): DagPaneState {
  return { ...state, focusArea: focusAreaPageUp(state.focusArea) };
}
export function dagPaneScrollByX(state: DagPaneState, dx: number): DagPaneState {
  return { ...state, focusArea: focusAreaScrollByX(state.focusArea, dx) };
}
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
export function dagPane(state: DagPaneState, options?: DagPaneRenderOptions): string {
  return focusArea(state.focusArea, options);
}
