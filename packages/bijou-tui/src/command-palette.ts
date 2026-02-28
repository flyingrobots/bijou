/**
 * Command palette building block — a filterable, navigable action list.
 *
 * Provides state transformers for filtering, focus, and page navigation,
 * a pure render function with viewport clipping, and a convenience keymap.
 *
 * ```ts
 * // In TEA init:
 * const cpState = createCommandPaletteState(items);
 *
 * // In TEA view:
 * const output = commandPalette(model.cpState, { width: 60 });
 *
 * // In TEA update:
 * case 'filter':
 *   return [{ ...model, cpState: cpFilter(model.cpState, msg.query) }, []];
 * case 'select':
 *   const selected = cpSelectedItem(model.cpState);
 *   // handle selection...
 * ```
 */

import type { BijouContext } from '@flyingrobots/bijou';
import { createKeyMap, type KeyMap } from './keybindings.js';
import { clipToWidth } from './viewport.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single item in the command palette. */
export interface CommandPaletteItem {
  /** Unique identifier for the command. */
  readonly id: string;
  /** Display label shown in the list. */
  readonly label: string;
  /** Optional description displayed after the label. */
  readonly description?: string;
  /** Optional category shown in brackets before the label. */
  readonly category?: string;
  /** Optional keyboard shortcut hint displayed at the end. */
  readonly shortcut?: string;
}

/** Immutable state for the command palette widget. */
export interface CommandPaletteState {
  /** All registered command items (unfiltered). */
  readonly items: readonly CommandPaletteItem[];
  /** Items matching the current query. */
  readonly filteredItems: readonly CommandPaletteItem[];
  /** Current filter query string. */
  readonly query: string;
  /** Index of the focused item within `filteredItems`. */
  readonly focusIndex: number;
  /** Vertical scroll offset (first visible item index). */
  readonly scrollY: number;
  /** Maximum number of visible items. */
  readonly height: number;
}

/** Options for rendering the command palette view. */
export interface CommandPaletteOptions {
  /** Total width in columns. */
  readonly width: number;
  /** Show item categories in brackets (default: true). */
  readonly showCategory?: boolean;
  /** Show shortcut hints (default: true). */
  readonly showShortcut?: boolean;
  /** Bijou context for theming and styling. */
  readonly ctx?: BijouContext;
}

// ---------------------------------------------------------------------------
// State creation
// ---------------------------------------------------------------------------

/**
 * Create initial command palette state from items and optional height.
 * Focus starts at index 0 with empty query showing all items.
 *
 * @param items - Command items to populate the palette.
 * @param height - Maximum number of visible items (default: 10).
 * @returns Fresh command palette state with all items visible.
 */
export function createCommandPaletteState(
  items: readonly CommandPaletteItem[],
  height = 10,
): CommandPaletteState {
  const h = Math.max(1, height);
  const copied = [...items];
  return {
    items: copied,
    filteredItems: copied,
    query: '',
    focusIndex: 0,
    scrollY: 0,
    height: h,
  };
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

/**
 * Test whether an item matches a search query (case-insensitive substring).
 *
 * Checks id, label, description, category, and shortcut fields.
 *
 * @param item - Command palette item to test.
 * @param query - Search query string.
 * @returns True if any field contains the query.
 */
function matchesQuery(item: CommandPaletteItem, query: string): boolean {
  const q = query.toLowerCase();
  if (item.label.toLowerCase().includes(q)) return true;
  if (item.description?.toLowerCase().includes(q)) return true;
  if (item.category?.toLowerCase().includes(q)) return true;
  if (item.id.toLowerCase().includes(q)) return true;
  if (item.shortcut?.toLowerCase().includes(q)) return true;
  return false;
}

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
  const filtered = state.items.filter(item => matchesQuery(item, query));
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

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/**
 * Render the command palette — a search line followed by filtered items
 * in the viewport with a focus indicator.
 *
 * Layout:
 * - Line 1: `> {query}` search input
 * - Lines 2+: filtered items in viewport
 * - Each item: `[category] label  description  shortcut`
 * - Focus indicator: `▸` on focused item
 *
 * @param state - Current command palette state.
 * @param options - Width, display flags, and context for rendering.
 * @returns Rendered command palette string with search line and item list.
 */
export function commandPalette(
  state: CommandPaletteState,
  options: CommandPaletteOptions,
): string {
  const { width, showCategory = true, showShortcut = true, ctx } = options;
  const lines: string[] = [];

  // Search line
  const searchPrefix = '> ';
  const queryLine = searchPrefix + state.query;
  lines.push(clipToWidth(queryLine, width));

  if (state.filteredItems.length === 0) {
    lines.push(clipToWidth('  No matches', width));
    return lines.join('\n');
  }

  // Visible items in viewport
  const visible = state.filteredItems.slice(state.scrollY, state.scrollY + state.height);

  const indicator = '\u25b8'; // ▸
  const pad = ' ';
  const muted = (text: string) =>
    ctx ? ctx.style.styled(ctx.theme.theme.semantic.muted, text) : text;

  for (let i = 0; i < visible.length; i++) {
    const item = visible[i]!;
    const globalIndex = state.scrollY + i;
    const prefix = globalIndex === state.focusIndex ? indicator : pad;

    const parts: string[] = [];

    if (showCategory && item.category) {
      parts.push(muted(`[${item.category}]`));
    }

    parts.push(item.label);

    if (item.description) {
      parts.push(muted(item.description));
    }

    if (showShortcut && item.shortcut) {
      parts.push(muted(item.shortcut));
    }

    const content = parts.join('  ');
    const line = `${prefix} ${content}`;
    lines.push(clipToWidth(line, width));
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Convenience keymap
// ---------------------------------------------------------------------------

/**
 * Create a preconfigured KeyMap for command palette navigation.
 *
 * Bindings: Ctrl+N/Down (next), Ctrl+P/Up (prev), Ctrl+D/PageDown (page down),
 * Ctrl+U/PageUp (page up), Enter (select), Escape (close).
 *
 * Ctrl+D and Ctrl+U follow vim half-page scroll conventions. In raw-mode TUIs
 * these do not conflict with shell behavior (EOF / line-clear).
 *
 * ```ts
 * const keys = commandPaletteKeyMap({
 *   focusNext: { type: 'cp-next' },
 *   focusPrev: { type: 'cp-prev' },
 *   pageDown: { type: 'cp-page-down' },
 *   pageUp: { type: 'cp-page-up' },
 *   select: { type: 'cp-select' },
 *   close: { type: 'cp-close' },
 * });
 * ```
 *
 * @template Msg - Application message type dispatched by key bindings.
 * @param actions - Map of navigation and selection actions to message values.
 * @returns Preconfigured key map with Ctrl+N/P, arrow, and page navigation bindings.
 */
export function commandPaletteKeyMap<Msg>(actions: {
  focusNext: Msg;
  focusPrev: Msg;
  pageDown: Msg;
  pageUp: Msg;
  select: Msg;
  close: Msg;
}): KeyMap<Msg> {
  return createKeyMap<Msg>()
    .group('Navigation', (g) => g
      .bind('ctrl+n', 'Next item', actions.focusNext)
      .bind('down', 'Next item', actions.focusNext)
      .bind('ctrl+p', 'Previous item', actions.focusPrev)
      .bind('up', 'Previous item', actions.focusPrev)
      .bind('ctrl+d', 'Half page down', actions.pageDown)
      .bind('pagedown', 'Half page down', actions.pageDown)
      .bind('ctrl+u', 'Half page up', actions.pageUp)
      .bind('pageup', 'Half page up', actions.pageUp),
    )
    .bind('enter', 'Select', actions.select)
    .bind('escape', 'Close', actions.close);
}
