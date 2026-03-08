/**
 * Dockable panel manager — reorder panes within containers.
 *
 * Pure, immutable state reducers for per-page panel dock ordering.
 */

import type { FrameLayoutNode } from './app-frame.js';

/** Direction for moving a pane within its container. */
export type DockDirection = 'up' | 'down' | 'left' | 'right';

/** Immutable dock state tracking child order overrides per container. */
export interface PanelDockState {
  /** Map from container (split/grid) ID to ordered array of child pane IDs. */
  readonly orderByContainer: Readonly<Record<string, readonly string[]>>;
}

/** Create initial (empty) panel dock state. */
export function createPanelDockState(): PanelDockState {
  return { orderByContainer: {} };
}

/**
 * Move a pane in its container in the given direction.
 *
 * For splits: swaps pane A and pane B when moving in the split axis direction.
 * For grids: rotates the area assignment.
 *
 * @param state - Current dock state.
 * @param containerId - ID of the parent container (split/grid).
 * @param paneId - ID of the pane to move.
 * @param direction - Direction to move.
 * @param containerChildIds - Current ordered child IDs of the container.
 * @returns Updated dock state.
 */
export function movePaneInContainer(
  state: PanelDockState,
  containerId: string,
  paneId: string,
  direction: DockDirection,
  containerChildIds: readonly string[],
): PanelDockState {
  const currentOrder = state.orderByContainer[containerId] ?? [...containerChildIds];
  const idx = currentOrder.indexOf(paneId);
  if (idx < 0) return state;

  const isForward = direction === 'down' || direction === 'right';
  const targetIdx = isForward ? idx + 1 : idx - 1;
  if (targetIdx < 0 || targetIdx >= currentOrder.length) return state;

  const next = [...currentOrder];
  // Swap positions
  next[idx] = currentOrder[targetIdx]!;
  next[targetIdx] = paneId;

  return {
    orderByContainer: {
      ...state.orderByContainer,
      [containerId]: next,
    },
  };
}

/**
 * Resolve the child order for a container, applying any dock state overrides.
 *
 * @param state - Current dock state.
 * @param containerId - ID of the container.
 * @param defaultChildIds - Default child order from the layout tree.
 * @returns The resolved child order.
 */
export function resolveChildOrder(
  state: PanelDockState,
  containerId: string,
  defaultChildIds: readonly string[],
): readonly string[] {
  const override = state.orderByContainer[containerId];
  if (!override) return defaultChildIds;

  // Validate: override must contain exactly the same IDs
  if (override.length !== defaultChildIds.length) return defaultChildIds;
  const defaultSet = new Set(defaultChildIds);
  for (const id of override) {
    if (!defaultSet.has(id)) return defaultChildIds;
  }

  return override;
}

/**
 * Walk a layout tree to find the parent container of a given pane.
 *
 * @param node - Root of the layout tree.
 * @param paneId - ID of the pane to find.
 * @returns The container node and its ID, or undefined if not found.
 */
export function findPaneContainer(
  node: FrameLayoutNode,
  paneId: string,
): { containerId: string; childIds: readonly string[] } | undefined {
  if (node.kind === 'pane') return undefined;

  if (node.kind === 'split') {
    const childIds = [
      getNodeId(node.paneA),
      getNodeId(node.paneB),
    ];

    // Check if either direct child is the target pane
    if (getNodeId(node.paneA) === paneId || getNodeId(node.paneB) === paneId) {
      return { containerId: node.splitId, childIds };
    }

    // Recurse into children
    return findPaneContainer(node.paneA, paneId) ?? findPaneContainer(node.paneB, paneId);
  }

  // Grid — derive childIds from node IDs, not area names
  const areaNames = Object.keys(node.cells);
  const gridChildIds = areaNames.map((name) => getNodeId(node.cells[name]!));
  for (let i = 0; i < areaNames.length; i++) {
    if (gridChildIds[i] === paneId) {
      return { containerId: node.gridId, childIds: gridChildIds };
    }
  }

  // Recurse into grid children
  for (const areaName of areaNames) {
    const child = node.cells[areaName]!;
    const found = findPaneContainer(child, paneId);
    if (found) return found;
  }

  return undefined;
}

/** Get the identifying ID of a layout node (paneId, splitId, or gridId). */
export function getNodeId(node: FrameLayoutNode): string {
  switch (node.kind) {
    case 'pane': return node.paneId;
    case 'split': return node.splitId;
    case 'grid': return node.gridId;
  }
}
