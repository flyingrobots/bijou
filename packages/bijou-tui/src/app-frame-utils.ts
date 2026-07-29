/**
 * Pure utility functions for `app-frame.ts`.
 *
 * Tree traversal, layout geometry, key map construction, and binding
 * source merging — no state, no side effects.
 */

import type { FrameLayoutNode } from './app-frame.js';
import type { FramePageText } from './app-frame-types.js';
import type { PanelVisibilityState } from './panel-state.js';
import { isMinimized } from './panel-state.js';
import type { BindingSource } from './help.js';
import type { BindingInfo } from './keybindings.js';

/** Recursively collect all pane IDs from a layout tree in declaration order. */
export function collectPaneIds(node: FrameLayoutNode): string[] {
  if (node.kind === 'pane') return [node.paneId];
  if (node.kind === 'split')
    return [...collectPaneIds(node.paneA), ...collectPaneIds(node.paneB)];

  const ids: string[] = [];
  for (const areaName of declaredAreaNames(node.areas)) {
    const child = node.cells[areaName];
    if (child == null) continue;
    ids.push(...collectPaneIds(child));
  }
  return ids;
}

/** Extract unique area names from CSS-grid-style template strings. */
export function declaredAreaNames(areas: readonly string[]): string[] {
  const names = new Set<string>();
  for (const row of areas) {
    for (const token of row.trim().split(/\s+/)) {
      if (token !== '' && token !== '.') names.add(token);
    }
  }
  return [...names];
}

/** Throw if any pane ID appears more than once in the given list. */
export function assertUniquePaneIds(
  paneIds: readonly string[],
  scope: string,
): void {
  const seen = new Set<string>();
  for (const paneId of paneIds) {
    if (seen.has(paneId)) {
      throw new Error(
        `createFramedApp: duplicate paneId "${paneId}" in ${scope}`,
      );
    }
    seen.add(paneId);
  }
}

/** Resolve static or model-derived framed page text. */
export function resolveFramePageText<PageModel>(
  source: FramePageText<PageModel> | undefined,
  model: PageModel,
): string | undefined {
  return typeof source === 'function' ? source(model) : source;
}

/** Walk the layout tree to find the pane node with the given ID. */
export function findPaneNode(
  node: FrameLayoutNode,
  paneId: string,
): Extract<FrameLayoutNode, { kind: 'pane' }> | undefined {
  if (node.kind === 'pane') return node.paneId === paneId ? node : undefined;
  if (node.kind === 'split')
    return findPaneNode(node.paneA, paneId) ?? findPaneNode(node.paneB, paneId);
  for (const key of Object.keys(node.cells)) {
    const child = node.cells[key];
    if (child === undefined) continue;
    const found = findPaneNode(child, paneId);
    if (found) return found;
  }
  return undefined;
}

/** Check if a layout node (or its first descendant pane) is minimized. */
export function isPaneMinimized(
  node: FrameLayoutNode,
  visibility: PanelVisibilityState,
): boolean {
  if (node.kind === 'pane') return isMinimized(visibility, node.paneId);
  // For containers, check if all descendant panes are minimized
  const paneIds = collectPaneIds(node);
  return (
    paneIds.length > 0 && paneIds.every((id) => isMinimized(visibility, id))
  );
}

/** Merge two read-only maps into a new mutable map. */
export function mergeMaps<K, V>(
  a: ReadonlyMap<K, V>,
  b: ReadonlyMap<K, V>,
): Map<K, V> {
  const out = new Map<K, V>();
  for (const [k, v] of a) out.set(k, v);
  for (const [k, v] of b) out.set(k, v);
  return out;
}

/** Combine multiple binding sources into a single source for help display. */
export function mergeBindingSources(
  ...sources: (BindingSource | undefined)[]
): BindingSource {
  return {
    bindings(): readonly BindingInfo[] {
      const merged: BindingInfo[] = [];
      for (const src of sources) {
        if (src == null) continue;
        merged.push(...src.bindings());
      }
      return merged;
    },
  };
}

export { createFrameKeyMap } from './app-frame-keymap.js';
export type { FrameKeyMapOptions } from './app-frame-keymap.js';
export { fitLine, frameBodyRect, offsetRect } from './app-frame-geometry.js';
