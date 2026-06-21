import { describe, it, expect } from 'vitest';
import { surfaceToString } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { createBrowsableListState, listFocusNext, browsableList, browsableListSurface } from './browsable-list.js';

describe('browsableList', () => {
  const ctx = createTestContext();

  const items = [
      { label: 'Apple', value: 'apple' },
      { label: 'Banana', value: 'banana', description: 'Yellow fruit' },
      { label: 'Cherry', value: 'cherry' },
      { label: 'Date', value: 'date' },
      { label: 'Elderberry', value: 'elderberry' },
    ];

  describe('render', () => {
      it('shows focus indicator on focused item', () => {
        const state = createBrowsableListState({ items, height: 3 });
        const output = browsableList(state);
        const lines = output.split('\n');
        expect(lines[0]).toContain('\u25b8');
        expect(lines[0]).toContain('Apple');
        expect(lines[1]).toContain(' ');
        expect(lines[1]).toContain('Banana');
      });

      it('renders description with em-dash', () => {
        const state = createBrowsableListState({ items, height: 3 });
        const output = browsableList(state);
        expect(output).toContain('\u2014 Yellow fruit');
      });

      it('renders empty list as empty string', () => {
        const state = createBrowsableListState({ items: [] });
        const output = browsableList(state);
        expect(output).toBe('');
      });

      it('custom focus indicator', () => {
        const state = createBrowsableListState({ items, height: 3 });
        const output = browsableList(state, { focusIndicator: '>' });
        expect(output).toContain('>');
      });

      it('only shows items within viewport', () => {
        const state = createBrowsableListState({ items, height: 2 });
        const output = browsableList(state);
        const lines = output.split('\n');
        expect(lines).toHaveLength(2);
        expect(output).toContain('Apple');
        expect(output).toContain('Banana');
        expect(output).not.toContain('Cherry');
      });

      it('renders a viewport-backed surface with fixed height', () => {
        const state = createBrowsableListState({ items, height: 2 });
        const surface = browsableListSurface(state, { width: 24 });
        const rendered = surfaceToString(surface, ctx.style);

        expect(surface.width).toBe(24);
        expect(surface.height).toBe(2);
        expect(rendered).toContain('Apple');
        expect(rendered).toContain('Banana');
        expect(rendered).not.toContain('Cherry');
      });

      it('uses canonical full-row selection and one-cell inset in the surface path', () => {
        const themedCtx = createTestContext({ mode: 'interactive' });
        const state = createBrowsableListState({ items, height: 2 });
        const surface = browsableListSurface(state, { width: 24, ctx: themedCtx });

        expect(surface.get(0, 0).bg).toBe(themedCtx.surface('elevated').bg);
        expect(surface.get(1, 0).char).toBe('\u25b8');
        expect(surface.get(0, 1).bg).not.toBe(themedCtx.surface('elevated').bg);
      });

      it('surface path follows the shared scroll window', () => {
        let state = createBrowsableListState({ items, height: 2 });
        state = listFocusNext(state);
        state = listFocusNext(state);

        const rendered = surfaceToString(
          browsableListSurface(state, { width: 24 }),
          ctx.style,
        );

        expect(rendered).not.toContain('Apple');
        expect(rendered).toContain('Banana');
        expect(rendered).toContain('Cherry');
      });

      it('supports custom item rendering in the surface path', () => {
        const state = createBrowsableListState({ items: [{ label: 'ignored', value: 'x' }], height: 1 });
        const rendered = surfaceToString(
          browsableListSurface(state, {
            width: 20,
            renderItem: ({ item, focused }) => focused ? `> ${item.value}` : item.value,
          }),
          ctx.style,
        );

        expect(rendered).toContain('> x');
        expect(rendered).not.toContain('ignored');
      });

      it('marquees the focused row when it overflows the available width', () => {
        const state = createBrowsableListState({
          items: [{ label: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', value: 'alpha' }],
          height: 1,
        });
        const initial = surfaceToString(
          browsableListSurface(state, {
            width: 12,
            renderItem: ({ item }) => item.label,
            focusedRowOverflow: { mode: 'marquee', elapsedMs: 0, stepMs: 200, startDelayMs: 0, endDelayMs: 0 },
          }),
          ctx.style,
        );
        const shifted = surfaceToString(
          browsableListSurface(state, {
            width: 12,
            renderItem: ({ item }) => item.label,
            focusedRowOverflow: { mode: 'marquee', elapsedMs: 1200, stepMs: 200, startDelayMs: 0, endDelayMs: 0 },
          }),
          ctx.style,
        );

        expect(initial).toContain('ABCDEFGHIJ');
        expect(shifted).toContain('GHIJKLMNOP');
        expect(shifted).not.toBe(initial);
      });
    });
});
