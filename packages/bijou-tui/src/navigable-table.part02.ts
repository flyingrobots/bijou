import { table, tableSurface } from '@flyingrobots/bijou';

import type { Surface } from '@flyingrobots/bijou';

import { createKeyMap } from './keybindings.js';

import type { KeyMap } from './keybindings.js';

import { resolveNavigableTableState } from './navigable-table.part01.js';

import type { NavTableRenderOptions, NavTableSurfaceOptions, NavigableTableInput, NavigableTableState } from './navigable-table.part01.js';
export function navTablePageDown(state: NavigableTableState): NavigableTableState {
  if (state.rows.length === 0) return state;
  const focusRow = Math.min(state.focusRow + state.height, state.rows.length - 1);
  return { ...state, focusRow, scrollY: adjustScroll(focusRow, state.scrollY, state.height, state.rows.length) };
}
export function navTablePageUp(state: NavigableTableState): NavigableTableState {
  if (state.rows.length === 0) return state;
  const focusRow = Math.max(state.focusRow - state.height, 0);
  return { ...state, focusRow, scrollY: adjustScroll(focusRow, state.scrollY, state.height, state.rows.length) };
}
export function adjustScroll(focusRow: number, scrollY: number, height: number, totalRows: number): number {
  let newScrollY = scrollY;
  if (focusRow < newScrollY) {
    newScrollY = focusRow;
  } else if (focusRow >= newScrollY + height) {
    newScrollY = focusRow - height + 1;
  }
  const maxScroll = Math.max(0, totalRows - height);
  return Math.min(newScrollY, maxScroll);
}
export function navigableTable(input: NavigableTableInput, options?: NavTableRenderOptions): string {
  const state = resolveNavigableTableState(input);
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
export function navigableTableSurface(
  state: NavigableTableInput,
  options?: NavTableSurfaceOptions,
): Surface {
  const resolvedState = resolveNavigableTableState(state);
  if (resolvedState.rows.length === 0) {
    return tableSurface({ columns: resolvedState.columns, rows: [], ctx: options?.ctx });
  }

  const indicator = options?.focusIndicator ?? '\u25b8';
  const pad = ' '.repeat(indicator.length);
  const visibleRows = resolvedState.rows.slice(resolvedState.scrollY, resolvedState.scrollY + resolvedState.height);

  const decoratedRows = visibleRows.map((row, i) => {
    const globalIndex = resolvedState.scrollY + i;
    const prefix = globalIndex === resolvedState.focusRow ? indicator : pad;
    const firstCol = `${prefix} ${row[0] ?? ''}`;
    return [firstCol, ...row.slice(1)];
  });

  return tableSurface({
    columns: resolvedState.columns,
    rows: decoratedRows,
    ctx: options?.ctx,
  });
}
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
