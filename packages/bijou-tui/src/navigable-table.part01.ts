import { sanitizeNonNegativeInt, sanitizePositiveInt } from '@flyingrobots/bijou';

import type { BijouContext, TableColumn } from '@flyingrobots/bijou';

import { adjustScroll } from './navigable-table.part02.js';
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
export interface NavigableTableOptions {
  /** Column definitions (headers, widths, alignment). */
  readonly columns: TableColumn[];
  /** Data rows as arrays of cell strings. */
  readonly rows: readonly (readonly string[])[];
  /** Maximum number of visible data rows (default: 10). */
  readonly height?: number;
}
export interface NavigableTableInput extends NavigableTableOptions {
  /** Optional focused row index for snapshot-style rendering. */
  readonly focusRow?: number;
  /** Optional scroll offset for snapshot-style rendering. */
  readonly scrollY?: number;
}
export function isNavigableTableOptions(
  value: NavigableTableOptions | readonly TableColumn[],
): value is NavigableTableOptions {
  return !Array.isArray(value);
}
export interface NavTableRenderOptions {
  /** Character(s) prepended to the focused row's first cell (default: `"\u25b8"`). */
  readonly focusIndicator?: string;
  /** Bijou context for theming and styling. */
  readonly ctx?: BijouContext;
}
export type NavTableSurfaceOptions = NavTableRenderOptions;
export function resolveNavigableTableOptions(
  optionsOrColumns: NavigableTableOptions | readonly TableColumn[],
  rows?: readonly (readonly string[])[],
  height?: number,
): NavigableTableOptions {
  if (isNavigableTableOptions(optionsOrColumns)) {
    return optionsOrColumns;
  }
  return { columns: [...optionsOrColumns], rows: rows ?? [], height };
}
export function resolveNavigableTableState(input: NavigableTableInput): NavigableTableState {
  const height = sanitizePositiveInt(input.height, 10);
  const rows = input.rows.map((row) => [...row]);
  const focusRow = rows.length === 0
    ? 0
    : Math.min(sanitizeNonNegativeInt(input.focusRow, 0), rows.length - 1);
  const scrollY = adjustScroll(
    focusRow,
    sanitizeNonNegativeInt(input.scrollY, 0),
    height,
    rows.length,
  );
  return {
    columns: [...input.columns],
    rows,
    focusRow,
    scrollY,
    height,
  };
}
export function createNavigableTableState(options: NavigableTableOptions): NavigableTableState;
export function createNavigableTableState(
  columns: readonly TableColumn[],
  rows: readonly (readonly string[])[],
  height?: number,
): NavigableTableState;
export function createNavigableTableState(
  optionsOrColumns: NavigableTableOptions | readonly TableColumn[],
  rows?: readonly (readonly string[])[],
  height?: number,
): NavigableTableState {
  return resolveNavigableTableState(resolveNavigableTableOptions(optionsOrColumns, rows, height));
}
export function navTableFocusNext(state: NavigableTableState): NavigableTableState {
  if (state.rows.length === 0) return state;
  const focusRow = (state.focusRow + 1) % state.rows.length;
  return { ...state, focusRow, scrollY: adjustScroll(focusRow, state.scrollY, state.height, state.rows.length) };
}
export function navTableFocusPrev(state: NavigableTableState): NavigableTableState {
  if (state.rows.length === 0) return state;
  const focusRow = (state.focusRow - 1 + state.rows.length) % state.rows.length;
  return { ...state, focusRow, scrollY: adjustScroll(focusRow, state.scrollY, state.height, state.rows.length) };
}
