import { describe, it, expect } from 'vitest';
import { createNavigableTableState, navTableFocusNext, navTableFocusPrev, navTablePageDown, navTablePageUp } from './navigable-table.js';

describe('navigableTable', () => {
  const columns = [{ header: 'Name' }, { header: 'Age' }];

  const rows = [
      ['Alice', '30'],
      ['Bob', '25'],
      ['Carol', '28'],
      ['Dave', '35'],
      ['Eve', '22'],
    ];

  describe('createNavigableTableState()', () => {
      it('creates state with defaults', () => {
        const state = createNavigableTableState({ columns, rows });
        expect(state.focusRow).toBe(0);
        expect(state.scrollY).toBe(0);
        expect(state.height).toBe(10);
        expect(state.rows).toEqual(rows);
      });

      it('accepts custom height', () => {
        const state = createNavigableTableState({ columns, rows, height: 3 });
        expect(state.height).toBe(3);
      });

      it('supports the shorthand constructor shape', () => {
        const state = createNavigableTableState(columns, rows, 3);
        expect(state.height).toBe(3);
        expect(state.rows).toEqual(rows);
        expect(state.focusRow).toBe(0);
      });

      it('clamps height to 1 when 0 is provided', () => {
        const state = createNavigableTableState({ columns, rows, height: 0 });
        expect(state.height).toBe(1);
      });

      it('clamps negative height to 1', () => {
        const state = createNavigableTableState({ columns, rows, height: -5 });
        expect(state.height).toBe(1);
      });

      it('falls back for non-finite height and floors fractional height', () => {
        expect(createNavigableTableState({ columns, rows, height: Number.NaN }).height).toBe(10);
        expect(createNavigableTableState({ columns, rows, height: 3.4 }).height).toBe(3);
      });
    });

  describe('focus navigation', () => {
      it('focusNext moves to next row', () => {
        const state = createNavigableTableState({ columns, rows });
        const next = navTableFocusNext(state);
        expect(next.focusRow).toBe(1);
      });

      it('focusNext wraps around', () => {
        let state = createNavigableTableState({ columns, rows });
        for (let remaining = rows.length; remaining > 0; remaining -= 1) state = navTableFocusNext(state);
        expect(state.focusRow).toBe(0);
      });

      it('focusPrev moves to previous row', () => {
        let state = createNavigableTableState({ columns, rows });
        state = navTableFocusNext(state);
        state = navTableFocusPrev(state);
        expect(state.focusRow).toBe(0);
      });

      it('focusPrev wraps around', () => {
        const state = createNavigableTableState({ columns, rows });
        const prev = navTableFocusPrev(state);
        expect(prev.focusRow).toBe(rows.length - 1);
      });

      it('empty rows are no-ops', () => {
        const state = createNavigableTableState({ columns, rows: [] });
        expect(navTableFocusNext(state)).toBe(state);
        expect(navTableFocusPrev(state)).toBe(state);
      });
    });

  describe('page navigation', () => {
      it('pageDown moves by height', () => {
        const state = createNavigableTableState({ columns, rows, height: 2 });
        const paged = navTablePageDown(state);
        expect(paged.focusRow).toBe(2);
      });

      it('pageDown clamps to last row', () => {
        const state = createNavigableTableState({ columns, rows, height: 10 });
        const paged = navTablePageDown(state);
        expect(paged.focusRow).toBe(rows.length - 1);
      });

      it('pageUp moves up by height', () => {
        let state = createNavigableTableState({ columns, rows, height: 2 });
        state = navTablePageDown(navTablePageDown(state));
        state = navTablePageUp(state);
        expect(state.focusRow).toBe(2);
      });

      it('pageUp clamps to first row', () => {
        const state = createNavigableTableState({ columns, rows, height: 10 });
        const paged = navTablePageUp(state);
        expect(paged.focusRow).toBe(0);
      });
    });

  describe('scroll follows focus', () => {
      it('scrollY adjusts when focus goes below viewport', () => {
        let state = createNavigableTableState({ columns, rows, height: 2 });
        state = navTableFocusNext(state);
        state = navTableFocusNext(state);
        expect(state.scrollY).toBe(1);
      });

      it('scrollY adjusts when focus goes above viewport', () => {
        let state = createNavigableTableState({ columns, rows, height: 2 });
        // Go to bottom, then wrap to 0
        for (let remaining = rows.length; remaining > 0; remaining -= 1) state = navTableFocusNext(state);
        expect(state.focusRow).toBe(0);
        expect(state.scrollY).toBe(0);
      });
    });
});
