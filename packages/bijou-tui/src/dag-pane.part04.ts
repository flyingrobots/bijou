import { dagLayout, isSlicedDagSource } from '@flyingrobots/bijou';

import type { BijouContext, DagLayout, DagNode, DagNodePosition, DagOptions, SlicedDagSource } from '@flyingrobots/bijou';

import { focusAreaSetContent } from './focus-area.js';

import type { FocusAreaState } from './focus-area.js';

import { scrollTo, scrollToX } from './viewport.js';

import type { Adjacency, DagPaneDagOptions, DagPaneState } from './dag-pane.part01.js';

import { computeHighlightPath } from './dag-pane.part03.js';
export function scrollToNode(
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
export function renderLayout(
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
  // Type narrowing required — dagLayout has separate overloads for
  // DagNode[] and SlicedDagSource; a union won't resolve either overload.
  return isSlicedDagSource(source)
    ? dagLayout(source, opts)
    : dagLayout(source, opts);
}
export function updateSelection(
  state: DagPaneState,
  newId: string | undefined,
  adjacency: Adjacency,
  ctx?: BijouContext,
): DagPaneState {
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
