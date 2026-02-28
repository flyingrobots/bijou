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

export interface CommandPaletteItem {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly category?: string;
  readonly shortcut?: string;
}

export interface CommandPaletteState {
  readonly items: readonly CommandPaletteItem[];
  readonly filteredItems: readonly CommandPaletteItem[];
  readonly query: string;
  readonly focusIndex: number;
  readonly scrollY: number;
  readonly height: number;
}

export interface CommandPaletteOptions {
  readonly width: number;
  readonly showCategory?: boolean;
  readonly showShortcut?: boolean;
  readonly ctx?: BijouContext;
}

// ---------------------------------------------------------------------------
// State creation
// ---------------------------------------------------------------------------

/**
 * Create initial command palette state from items and optional height.
 * Focus starts at index 0 with empty query showing all items.
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

function matchesQuery(item: CommandPaletteItem, query: string): boolean {
  const q = query.toLowerCase();
  if (item.label.toLowerCase().includes(q)) return true;
  if (item.description?.toLowerCase().includes(q)) return true;
  if (item.category?.toLowerCase().includes(q)) return true;
  if (item.id.toLowerCase().includes(q)) return true;
  return false;
}

/** Filter items by case-insensitive substring match. Resets focus to 0. */
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

function adjustScroll(focusIndex: number, scrollY: number, height: number, total: number): number {
  let s = scrollY;
  if (focusIndex < s) s = focusIndex;
  else if (focusIndex >= s + height) s = focusIndex - height + 1;
  return Math.min(s, Math.max(0, total - height));
}

/** Move focus to the next item (wraps around on filteredItems). */
export function cpFocusNext(state: CommandPaletteState): CommandPaletteState {
  if (state.filteredItems.length === 0) return state;
  const focusIndex = (state.focusIndex + 1) % state.filteredItems.length;
  return { ...state, focusIndex, scrollY: adjustScroll(focusIndex, state.scrollY, state.height, state.filteredItems.length) };
}

/** Move focus to the previous item (wraps around on filteredItems). */
export function cpFocusPrev(state: CommandPaletteState): CommandPaletteState {
  if (state.filteredItems.length === 0) return state;
  const focusIndex = (state.focusIndex - 1 + state.filteredItems.length) % state.filteredItems.length;
  return { ...state, focusIndex, scrollY: adjustScroll(focusIndex, state.scrollY, state.height, state.filteredItems.length) };
}

/** Move focus down by one page (clamps to last item). */
export function cpPageDown(state: CommandPaletteState): CommandPaletteState {
  if (state.filteredItems.length === 0) return state;
  const focusIndex = Math.min(state.focusIndex + state.height, state.filteredItems.length - 1);
  return { ...state, focusIndex, scrollY: adjustScroll(focusIndex, state.scrollY, state.height, state.filteredItems.length) };
}

/** Move focus up by one page (clamps to first item). */
export function cpPageUp(state: CommandPaletteState): CommandPaletteState {
  if (state.filteredItems.length === 0) return state;
  const focusIndex = Math.max(state.focusIndex - state.height, 0);
  return { ...state, focusIndex, scrollY: adjustScroll(focusIndex, state.scrollY, state.height, state.filteredItems.length) };
}

/** Get the currently focused item, or undefined if no items match. */
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
    lines.push('  No matches');
    return lines.join('\n');
  }

  // Visible items in viewport
  const visible = state.filteredItems.slice(state.scrollY, state.scrollY + state.height);

  const indicator = '\u25b8'; // ▸
  const pad = ' ';

  for (let i = 0; i < visible.length; i++) {
    const item = visible[i]!;
    const globalIndex = state.scrollY + i;
    const prefix = globalIndex === state.focusIndex ? indicator : pad;

    const parts: string[] = [];

    if (showCategory && item.category) {
      const catText = ctx
        ? ctx.style.styled(ctx.theme.theme.semantic.muted, `[${item.category}]`)
        : `[${item.category}]`;
      parts.push(catText);
    }

    parts.push(item.label);

    if (item.description) {
      const descText = ctx
        ? ctx.style.styled(ctx.theme.theme.semantic.muted, item.description)
        : item.description;
      parts.push(descText);
    }

    if (showShortcut && item.shortcut) {
      const shortcutText = ctx
        ? ctx.style.styled(ctx.theme.theme.semantic.muted, item.shortcut)
        : item.shortcut;
      parts.push(shortcutText);
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
    .bind('escape', 'Close', actions.close);
}
