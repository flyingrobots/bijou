/**
 * Navigable table building block.
 *
 * Wraps the static `table()` from bijou core with focus management,
 * keyboard navigation, and vertical scrolling.
 *
 * ```ts
 * // In TEA init:
 * const tableState = createNavigableTableState({ columns, rows, height: 10 });
 *
 * // In TEA view:
 * const output = navigableTable(model.tableState, { ctx });
 *
 * // In TEA update:
 * case 'focus-next':
 *   return [{ ...model, tableState: navTableFocusNext(model.tableState) }, []];
 * ```
 */

import {
  table,
  type TableColumn,
  type BijouContext,
} from '@flyingrobots/bijou';
import { createKeyMap, type KeyMap } from './keybindings.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Immutable state for the navigable table widget. */
export interface NavigableTableState {
  /** Column definitions (headers, widths, alignment). */
  readonly columns: TableColumn[];
  /** All data rows as arrays of cell strings. */
  readonly rows: readonly (readonly string[])[];
  /** Index of the currently focused row. */
  readonly focusRow: number;
  /** Vertical scroll offset (first visible row index). */
  readonly scrollY: number;
  /** Maximum number of visible data rows. */
  readonly height: number;
}

/** Options for creating a new navigable table state. */
export interface NavigableTableOptions {
  /** Column definitions (headers, widths, alignment). */
  readonly columns: TableColumn[];
  /** Data rows as arrays of cell strings. */
  readonly rows: readonly (readonly string[])[];
  /** Maximum number of visible data rows (default: 10). */
  readonly height?: number;
}

/** Options for rendering the navigable table view. */
export interface NavTableRenderOptions {
  /** Character(s) prepended to the focused row's first cell (default: `"\u25b8"`). */
  readonly focusIndicator?: string;
  /** Bijou context for theming and styling. */
  readonly ctx?: BijouContext;
}

// ---------------------------------------------------------------------------
// State creation
// ---------------------------------------------------------------------------

/**
 * Create initial navigable table state.
 *
 * `height` defaults to 10 rows when not provided.
 *
 * @param options - Columns, rows, and optional viewport height.
 * @returns Fresh table state with focus on the first row.
 */
export function createNavigableTableState(options: NavigableTableOptions): NavigableTableState {
  const height = Math.max(1, options.height ?? 10);
  return {
    columns: [...options.columns],
    rows: options.rows.map((row) => [...row]),
    focusRow: 0,
    scrollY: 0,
    height,
  };
}

// ---------------------------------------------------------------------------
// State transformers
// ---------------------------------------------------------------------------

/**
 * Move focus to the next row (wraps around).
 *
 * @param state - Current table state.
 * @returns Updated table state with focus on the next row.
 */
export function navTableFocusNext(state: NavigableTableState): NavigableTableState {
  if (state.rows.length === 0) return state;
  const focusRow = (state.focusRow + 1) % state.rows.length;
  return { ...state, focusRow, scrollY: adjustScroll(focusRow, state.scrollY, state.height, state.rows.length) };
}

/**
 * Move focus to the previous row (wraps around).
 *
 * @param state - Current table state.
 * @returns Updated table state with focus on the previous row.
 */
export function navTableFocusPrev(state: NavigableTableState): NavigableTableState {
  if (state.rows.length === 0) return state;
  const focusRow = (state.focusRow - 1 + state.rows.length) % state.rows.length;
  return { ...state, focusRow, scrollY: adjustScroll(focusRow, state.scrollY, state.height, state.rows.length) };
}

/**
 * Move focus down by one page (clamps to last row).
 *
 * @param state - Current table state.
 * @returns Updated table state with focus advanced by one page.
 */
export function navTablePageDown(state: NavigableTableState): NavigableTableState {
  if (state.rows.length === 0) return state;
  const focusRow = Math.min(state.focusRow + state.height, state.rows.length - 1);
  return { ...state, focusRow, scrollY: adjustScroll(focusRow, state.scrollY, state.height, state.rows.length) };
}

/**
 * Move focus up by one page (clamps to first row).
 *
 * @param state - Current table state.
 * @returns Updated table state with focus moved back by one page.
 */
export function navTablePageUp(state: NavigableTableState): NavigableTableState {
  if (state.rows.length === 0) return state;
  const focusRow = Math.max(state.focusRow - state.height, 0);
  return { ...state, focusRow, scrollY: adjustScroll(focusRow, state.scrollY, state.height, state.rows.length) };
}

// ---------------------------------------------------------------------------
// Scroll helper
// ---------------------------------------------------------------------------

/**
 * Clamp scroll position so the focused row stays within the visible window.
 *
 * @param focusRow - Index of the focused row.
 * @param scrollY - Current scroll offset.
 * @param height - Viewport height in rows.
 * @param totalRows - Total number of data rows.
 * @returns Adjusted scroll offset.
 */
function adjustScroll(focusRow: number, scrollY: number, height: number, totalRows: number): number {
  let newScrollY = scrollY;
  if (focusRow < newScrollY) {
    newScrollY = focusRow;
  } else if (focusRow >= newScrollY + height) {
    newScrollY = focusRow - height + 1;
  }
  const maxScroll = Math.max(0, totalRows - height);
  return Math.min(newScrollY, maxScroll);
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/**
 * Render the navigable table with a focus indicator on the focused row.
 *
 * Slices visible rows based on `scrollY` and `height`, prepends a focus
 * indicator to the first column, then delegates to core `table()`.
 *
 * @param state - Current table state.
 * @param options - Rendering options (focus indicator, context).
 * @returns Rendered table string with focus indicator on the active row.
 */
export function navigableTable(state: NavigableTableState, options?: NavTableRenderOptions): string {
  if (state.rows.length === 0) {
    return table({ columns: state.columns, rows: [], ctx: options?.ctx });
  }

  const indicator = options?.focusIndicator ?? '\u25b8';
  const pad = ' '.repeat(indicator.length);

  // Slice visible window
  const visibleRows = state.rows.slice(state.scrollY, state.scrollY + state.height);

  // Prepend focus indicator to first column
  const decoratedRows = visibleRows.map((row, i) => {
    const globalIndex = state.scrollY + i;
    const prefix = globalIndex === state.focusRow ? indicator : pad;
    const firstCol = `${prefix} ${row[0] ?? ''}`;
    return [firstCol, ...row.slice(1)];
  });

  return table({
    columns: state.columns,
    rows: decoratedRows,
    ctx: options?.ctx,
  });
}

// ---------------------------------------------------------------------------
// Convenience keymap
// ---------------------------------------------------------------------------

/**
 * Create a preconfigured KeyMap for navigable table navigation.
 *
 * The caller provides their own message types for each action:
 * ```ts
 * const keys = navTableKeyMap({
 *   focusNext: { type: 'next-row' },
 *   focusPrev: { type: 'prev-row' },
 *   pageDown:  { type: 'page-down' },
 *   pageUp:    { type: 'page-up' },
 *   quit:      { type: 'quit' },
 * });
 * ```
 *
 * @template Msg - Application message type dispatched by key bindings.
 * @param actions - Map of navigation actions to message values.
 * @returns Preconfigured key map with vim-style table row bindings.
 */
export function navTableKeyMap<Msg>(actions: {
  focusNext: Msg;
  focusPrev: Msg;
  pageDown: Msg;
  pageUp: Msg;
  quit: Msg;
}): KeyMap<Msg> {
  return createKeyMap<Msg>()
    .group('Navigation', (g) => g
      .bind('j', 'Next row', actions.focusNext)
      .bind('down', 'Next row', actions.focusNext)
      .bind('k', 'Previous row', actions.focusPrev)
      .bind('up', 'Previous row', actions.focusPrev)
      .bind('d', 'Page down', actions.pageDown)
      .bind('pagedown', 'Page down', actions.pageDown)
      .bind('u', 'Page up', actions.pageUp)
      .bind('pageup', 'Page up', actions.pageUp),
    )
    .bind('q', 'Quit', actions.quit)
    .bind('ctrl+c', 'Quit', actions.quit);
}
