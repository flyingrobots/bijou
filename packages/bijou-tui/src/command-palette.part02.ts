import { queryScore } from './command-palette.part01.js';
import type { CommandPaletteItem, CommandPaletteState } from './command-palette.part01.js';

/**
 * Filter items by case-insensitive substring match. Resets focus to 0.
 *
 * @param state - Current command palette state.
 * @param query - Search query (empty string shows all items).
 * @returns Updated state with filtered items and focus reset.
 */
export function cpFilter(state: CommandPaletteState, query: string): CommandPaletteState {
  if (query === '') {
    return {
      ...state,
      query: '',
      filteredItems: [...state.items],
      focusIndex: 0,
      scrollY: 0,
    };
  }
  const filtered = state.items
    .map((item, index) => ({ item, index, score: queryScore(item, query) }))
    .filter((entry): entry is { readonly item: CommandPaletteItem; readonly index: number; readonly score: number } =>
      entry.score != null)
    .sort((left, right) => left.score - right.score || left.index - right.index)
    .map(entry => entry.item);
  return {
    ...state,
    query,
    filteredItems: filtered,
    focusIndex: 0,
    scrollY: 0,
  };
}

// ---------------------------------------------------------------------------
// Focus navigation
// ---------------------------------------------------------------------------

/**
 * Clamp scroll position so the focused item stays within the visible window.
 *
 * @param focusIndex - Index of the focused item.
 * @param scrollY - Current scroll offset.
 * @param height - Viewport height in items.
 * @param total - Total number of items.
 * @returns Adjusted scroll offset.
 */
function adjustScroll(focusIndex: number, scrollY: number, height: number, total: number): number {
  let s = scrollY;
  if (focusIndex < s) s = focusIndex;
  else if (focusIndex >= s + height) s = focusIndex - height + 1;
  return Math.min(s, Math.max(0, total - height));
}

/**
 * Move focus to the next item (wraps around on filteredItems).
 *
 * @param state - Current command palette state.
 * @returns Updated state with focus on the next item.
 */
export function cpFocusNext(state: CommandPaletteState): CommandPaletteState {
  if (state.filteredItems.length === 0) return state;
  const focusIndex = (state.focusIndex + 1) % state.filteredItems.length;
  return { ...state, focusIndex, scrollY: adjustScroll(focusIndex, state.scrollY, state.height, state.filteredItems.length) };
}

/**
 * Move focus to the previous item (wraps around on filteredItems).
 *
 * @param state - Current command palette state.
 * @returns Updated state with focus on the previous item.
 */
export function cpFocusPrev(state: CommandPaletteState): CommandPaletteState {
  if (state.filteredItems.length === 0) return state;
  const focusIndex = (state.focusIndex - 1 + state.filteredItems.length) % state.filteredItems.length;
  return { ...state, focusIndex, scrollY: adjustScroll(focusIndex, state.scrollY, state.height, state.filteredItems.length) };
}

/**
 * Move focus down by half a page (vim Ctrl+D convention, clamps to last item).
 *
 * @param state - Current command palette state.
 * @returns Updated state with focus advanced by half a page.
 */
export function cpPageDown(state: CommandPaletteState): CommandPaletteState {
  if (state.filteredItems.length === 0) return state;
  const half = Math.max(1, Math.floor(state.height / 2));
  const focusIndex = Math.min(state.focusIndex + half, state.filteredItems.length - 1);
  return { ...state, focusIndex, scrollY: adjustScroll(focusIndex, state.scrollY, state.height, state.filteredItems.length) };
}

/**
 * Move focus up by half a page (vim Ctrl+U convention, clamps to first item).
 *
 * @param state - Current command palette state.
 * @returns Updated state with focus moved back by half a page.
 */
export function cpPageUp(state: CommandPaletteState): CommandPaletteState {
  if (state.filteredItems.length === 0) return state;
  const half = Math.max(1, Math.floor(state.height / 2));
  const focusIndex = Math.max(state.focusIndex - half, 0);
  return { ...state, focusIndex, scrollY: adjustScroll(focusIndex, state.scrollY, state.height, state.filteredItems.length) };
}

/**
 * Get the currently focused item, or undefined if no items match.
 *
 * @param state - Current command palette state.
 * @returns The focused `CommandPaletteItem`, or `undefined` if empty.
 */
export function cpSelectedItem(state: CommandPaletteState): CommandPaletteItem | undefined {
  return state.filteredItems[state.focusIndex];
}
