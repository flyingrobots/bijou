/**
 * Browsable list building block — a scrollable, navigable list with focus tracking.
 *
 * Provides state transformers for focus and page navigation, a pure render
 * function with viewport clipping, and a convenience keymap for vim-style
 * navigation.
 *
 * ```ts
 * // In TEA init:
 * const listState = createBrowsableListState({ items, height: 10 });
 *
 * // In TEA view:
 * const output = browsableList(model.listState);
 *
 * // In TEA update:
 * case 'focus-next':
 *   return [{ ...model, listState: listFocusNext(model.listState) }, []];
 * case 'select':
 *   const selected = model.listState.items[model.listState.focusIndex];
 *   // handle selection...
 * ```
 */

import type { BijouContext } from '@flyingrobots/bijou';
import { createKeyMap, type KeyMap } from './keybindings.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BrowsableListItem<T = string> {
  label: string;
  value: T;
  description?: string;
}

export interface BrowsableListState<T = string> {
  readonly items: readonly BrowsableListItem<T>[];
  readonly focusIndex: number;
  readonly scrollY: number;
  readonly height: number;
}

export interface BrowsableListOptions<T = string> {
  readonly items: readonly BrowsableListItem<T>[];
  readonly height?: number;
}

export interface BrowsableListRenderOptions {
  readonly focusIndicator?: string;
  readonly ctx?: BijouContext;
}

// ---------------------------------------------------------------------------
// State creation
// ---------------------------------------------------------------------------

/**
 * Create initial browsable list state from items and optional height.
 * Focus starts at index 0 with scroll at the top.
 */
export function createBrowsableListState<T = string>(
  options: BrowsableListOptions<T>,
): BrowsableListState<T> {
  return {
    items: options.items,
    focusIndex: 0,
    scrollY: 0,
    height: options.height ?? 10,
  };
}

// ---------------------------------------------------------------------------
// State transformers
// ---------------------------------------------------------------------------

/** Move focus to the next item (wraps around). */
export function listFocusNext<T>(state: BrowsableListState<T>): BrowsableListState<T> {
  if (state.items.length === 0) return state;
  const focusIndex = (state.focusIndex + 1) % state.items.length;
  return { ...state, focusIndex, scrollY: adjustScroll(focusIndex, state.scrollY, state.height, state.items.length) };
}

/** Move focus to the previous item (wraps around). */
export function listFocusPrev<T>(state: BrowsableListState<T>): BrowsableListState<T> {
  if (state.items.length === 0) return state;
  const focusIndex = (state.focusIndex - 1 + state.items.length) % state.items.length;
  return { ...state, focusIndex, scrollY: adjustScroll(focusIndex, state.scrollY, state.height, state.items.length) };
}

/** Move focus down by one page (clamps to last item). */
export function listPageDown<T>(state: BrowsableListState<T>): BrowsableListState<T> {
  if (state.items.length === 0) return state;
  const focusIndex = Math.min(state.focusIndex + state.height, state.items.length - 1);
  return { ...state, focusIndex, scrollY: adjustScroll(focusIndex, state.scrollY, state.height, state.items.length) };
}

/** Move focus up by one page (clamps to first item). */
export function listPageUp<T>(state: BrowsableListState<T>): BrowsableListState<T> {
  if (state.items.length === 0) return state;
  const focusIndex = Math.max(state.focusIndex - state.height, 0);
  return { ...state, focusIndex, scrollY: adjustScroll(focusIndex, state.scrollY, state.height, state.items.length) };
}

// ---------------------------------------------------------------------------
// Scroll helper
// ---------------------------------------------------------------------------

function adjustScroll(focusIndex: number, scrollY: number, height: number, totalItems: number): number {
  let newScrollY = scrollY;
  if (focusIndex < newScrollY) {
    newScrollY = focusIndex;
  } else if (focusIndex >= newScrollY + height) {
    newScrollY = focusIndex - height + 1;
  }
  const maxScroll = Math.max(0, totalItems - height);
  return Math.min(newScrollY, maxScroll);
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/**
 * Render the browsable list — visible items within the viewport with a
 * focus indicator on the currently focused item.
 *
 * Items with a `description` field render as `label — description`.
 */
export function browsableList<T>(
  state: BrowsableListState<T>,
  options?: BrowsableListRenderOptions,
): string {
  if (state.items.length === 0) return '';

  const indicator = options?.focusIndicator ?? '\u25b8';
  const pad = ' '.repeat(indicator.length);

  const visibleItems = state.items.slice(state.scrollY, state.scrollY + state.height);
  const lines: string[] = [];

  for (let i = 0; i < visibleItems.length; i++) {
    const item = visibleItems[i]!;
    const globalIndex = state.scrollY + i;
    const prefix = globalIndex === state.focusIndex ? indicator : pad;
    const desc = item.description ? ` \u2014 ${item.description}` : '';
    lines.push(`${prefix} ${item.label}${desc}`);
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Convenience keymap
// ---------------------------------------------------------------------------

/**
 * Create a preconfigured KeyMap for browsable list navigation.
 *
 * The caller provides their own message types for each action:
 * ```ts
 * const keys = browsableListKeyMap({
 *   focusNext: { type: 'next' },
 *   focusPrev: { type: 'prev' },
 *   pageDown: { type: 'page-down' },
 *   pageUp: { type: 'page-up' },
 *   select: { type: 'select' },
 *   quit: { type: 'quit' },
 * });
 * ```
 */
export function browsableListKeyMap<Msg>(actions: {
  focusNext: Msg;
  focusPrev: Msg;
  pageDown: Msg;
  pageUp: Msg;
  select: Msg;
  quit: Msg;
}): KeyMap<Msg> {
  return createKeyMap<Msg>()
    .group('Navigation', (g) => g
      .bind('j', 'Next item', actions.focusNext)
      .bind('down', 'Next item', actions.focusNext)
      .bind('k', 'Previous item', actions.focusPrev)
      .bind('up', 'Previous item', actions.focusPrev)
      .bind('d', 'Page down', actions.pageDown)
      .bind('pagedown', 'Page down', actions.pageDown)
      .bind('u', 'Page up', actions.pageUp)
      .bind('pageup', 'Page up', actions.pageUp),
    )
    .bind('enter', 'Select', actions.select)
    .bind('q', 'Quit', actions.quit)
    .bind('ctrl+c', 'Quit', actions.quit);
}
