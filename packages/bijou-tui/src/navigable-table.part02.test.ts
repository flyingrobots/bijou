import { describe, it, expect } from 'vitest';
import { surfaceToString } from '@flyingrobots/bijou';
import { createNavigableTableState, navTableFocusNext, navigableTable, navigableTableSurface, navTableKeyMap } from './navigable-table.js';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';

describe('navigableTable', () => {
  const columns = [{ header: 'Name' }, { header: 'Age' }];

  const rows = [
      ['Alice', '30'],
      ['Bob', '25'],
      ['Carol', '28'],
      ['Dave', '35'],
      ['Eve', '22'],
    ];

  describe('render', () => {
      it('shows focus indicator on focused row', () => {
        const state = createNavigableTableState({ columns, rows, height: 3 });
        const ctx = createTestContext({ mode: 'interactive' });
        const output = navigableTable(state, { ctx });
        expect(output).toContain('\u25b8');
        expect(output).toContain('Alice');
      });

      it('renders empty table', () => {
        const state = createNavigableTableState({ columns, rows: [] });
        const ctx = createTestContext({ mode: 'interactive' });
        const output = navigableTable(state, { ctx });
        expect(output).toContain('Name');
      });

      it('renders a surface-native table with the same focused row semantics', () => {
        const state = createNavigableTableState({ columns, rows, height: 3 });
        const ctx = createTestContext({ mode: 'interactive' });
        const surface = navigableTableSurface(state, { ctx });
        const rendered = surfaceToString(surface, ctx.style);

        expect(surface.height).toBeGreaterThan(0);
        expect(rendered).toContain('\u25b8');
        expect(rendered).toContain('Alice');
      });

      it('accepts a lightweight input snapshot instead of a full state object', () => {
        const ctx = createTestContext({ mode: 'interactive' });
        const surface = navigableTableSurface({
          columns,
          rows,
          height: 3,
          focusRow: 1,
          scrollY: 0,
        }, { ctx });
        const rendered = surfaceToString(surface, ctx.style);

        expect(rendered).toContain('\u25b8');
        expect(rendered).toContain('Bob');
      });

      it('surface path keeps row-aware scrolling when rows wrap', () => {
        const wrapColumns = [{ header: 'Name', width: 10 }, { header: 'Notes', width: 12 }];
        const wrapRows = [
          ['Alpha', 'first row wraps across multiple rendered lines'],
          ['Beta', 'second row also wraps and should be the only visible data row'],
        ];
        let state = createNavigableTableState({ columns: wrapColumns, rows: wrapRows, height: 1 });
        state = navTableFocusNext(state);
        const ctx = createTestContext({ mode: 'interactive' });

        const rendered = surfaceToString(navigableTableSurface(state, { ctx }), ctx.style);

        expect(rendered).toContain('Beta');
        expect(rendered).not.toContain('Alpha');
      });
    });

  describe('keymap', () => {
      it('dispatches correct actions', () => {
        const actions = {
          focusNext: 'next',
          focusPrev: 'prev',
          pageDown: 'pd',
          pageUp: 'pu',
          quit: 'q',
        };
        const km = navTableKeyMap(actions);
        expect(km.handle({ type: 'key', key: 'j', ctrl: false, alt: false, shift: false })).toBe('next');
        expect(km.handle({ type: 'key', key: 'k', ctrl: false, alt: false, shift: false })).toBe('prev');
        expect(km.handle({ type: 'key', key: 'q', ctrl: false, alt: false, shift: false })).toBe('q');
      });
    });
});
