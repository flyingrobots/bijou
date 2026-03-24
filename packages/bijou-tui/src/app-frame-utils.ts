/**
 * Pure utility functions for `app-frame.ts`.
 *
 * Tree traversal, layout geometry, key map construction, and binding
 * source merging — no state, no side effects.
 */

import type { FrameLayoutNode } from './app-frame.js';
import type { FrameAction } from './app-frame-types.js';
import type { LayoutRect } from './layout-rect.js';
import type { PanelVisibilityState } from './panel-state.js';
import { isMinimized } from './panel-state.js';
import { createKeyMap, type KeyMap } from './keybindings.js';
import type { BindingSource } from './help.js';
import type { BindingInfo } from './keybindings.js';
import { clipToWidth, visibleLength } from './viewport.js';

/** Recursively collect all pane IDs from a layout tree in declaration order. */
export function collectPaneIds(node: FrameLayoutNode): string[] {
  if (node.kind === 'pane') return [node.paneId];
  if (node.kind === 'split') return [...collectPaneIds(node.paneA), ...collectPaneIds(node.paneB)];

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
export function assertUniquePaneIds(paneIds: readonly string[], scope: string): void {
  const seen = new Set<string>();
  for (const paneId of paneIds) {
    if (seen.has(paneId)) {
      throw new Error(`createFramedApp: duplicate paneId "${paneId}" in ${scope}`);
    }
    seen.add(paneId);
  }
}

/** Walk the layout tree to find the pane node with the given ID. */
export function findPaneNode(node: FrameLayoutNode, paneId: string): Extract<FrameLayoutNode, { kind: 'pane' }> | undefined {
  if (node.kind === 'pane') return node.paneId === paneId ? node : undefined;
  if (node.kind === 'split') return findPaneNode(node.paneA, paneId) ?? findPaneNode(node.paneB, paneId);
  for (const key of Object.keys(node.cells)) {
    const found = findPaneNode(node.cells[key]!, paneId);
    if (found) return found;
  }
  return undefined;
}

/** Check if a layout node (or its first descendant pane) is minimized. */
export function isPaneMinimized(node: FrameLayoutNode, visibility: PanelVisibilityState): boolean {
  if (node.kind === 'pane') return isMinimized(visibility, node.paneId);
  // For containers, check if all descendant panes are minimized
  const paneIds = collectPaneIds(node);
  return paneIds.length > 0 && paneIds.every((id) => isMinimized(visibility, id));
}

/** Merge two read-only maps into a new mutable map. */
export function mergeMaps<K, V>(a: ReadonlyMap<K, V>, b: ReadonlyMap<K, V>): Map<K, V> {
  const out = new Map<K, V>();
  for (const [k, v] of a) out.set(k, v);
  for (const [k, v] of b) out.set(k, v);
  return out;
}

/** Translate a layout rect by the given row and column offsets. */
export function offsetRect(rect: LayoutRect, rowOffset: number, colOffset: number): LayoutRect {
  return {
    row: rowOffset + rect.row,
    col: colOffset + rect.col,
    width: rect.width,
    height: rect.height,
  };
}

/** Compute the available rect for page content (screen minus header and footer). */
export function frameBodyRect(columns: number, rows: number): LayoutRect {
  return {
    row: Math.min(2, Math.max(0, rows)),
    col: 0,
    width: Math.max(0, columns),
    height: Math.max(0, rows - 2),
  };
}

/** Clip or pad a single line to exactly `width` visible columns. */
export function fitLine(line: string, width: number): string {
  const clipped = clipToWidth(line, Math.max(0, width));
  return clipped + ' '.repeat(Math.max(0, width - visibleLength(clipped)));
}

/** Combine multiple binding sources into a single source for help display. */
export function mergeBindingSources(...sources: Array<BindingSource | undefined>): BindingSource {
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

/** Build the default key map for frame-level actions (tabs, panes, scroll, help '?', command palette 'ctrl+p'/':'). */
export function createFrameKeyMap(options: { readonly enableSettings?: boolean } = {}): KeyMap<FrameAction> {
  const keyMap = createKeyMap<FrameAction>()
    .group('Frame', (g) => g
      .bind('?', 'Toggle help', { type: 'toggle-help' })
      .bind('[', 'Previous tab', { type: 'prev-tab' })
      .bind(']', 'Next tab', { type: 'next-tab' })
      .bind('tab', 'Next pane', { type: 'next-pane' })
      .bind('shift+tab', 'Previous pane', { type: 'prev-pane' })
      .bind('/', 'Search', { type: 'open-palette' })
      .bind('ctrl+p', 'Open command palette', { type: 'open-palette' })
      .bind(':', 'Open command palette', { type: 'open-palette' })
      .bind('ctrl+m', 'Fold/unfold pane', { type: 'toggle-minimize' })
      .bind('ctrl+f', 'Full-screen pane', { type: 'toggle-maximize' }),
    )
    .group('Dock', (g) => g
      .bind('ctrl+shift+up', 'Move pane up', { type: 'dock-up' })
      .bind('ctrl+shift+down', 'Move pane down', { type: 'dock-down' })
      .bind('ctrl+shift+left', 'Move pane left', { type: 'dock-left' })
      .bind('ctrl+shift+right', 'Move pane right', { type: 'dock-right' }),
    )
    .group('Scroll', (g) => g
      .bind('j', 'Scroll down', { type: 'scroll-down' })
      .bind('k', 'Scroll up', { type: 'scroll-up' })
      .bind('d', 'Page down', { type: 'page-down' })
      .bind('u', 'Page up', { type: 'page-up' })
      .bind('g', 'Top', { type: 'top' })
      .bind('shift+g', 'Bottom', { type: 'bottom' })
      .bind('h', 'Scroll left', { type: 'scroll-left' })
      .bind('l', 'Scroll right', { type: 'scroll-right' }),
    );

  if (options.enableSettings) {
    keyMap.group('Shell', (g) => g
      .bind('ctrl+,', 'Settings', { type: 'toggle-settings' })
      .bind('f2', 'Settings', { type: 'toggle-settings' }));
  }

  return keyMap;
}
