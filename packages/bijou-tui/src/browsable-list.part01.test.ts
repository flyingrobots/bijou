import { describe, it, expect } from 'vitest';
import { createBrowsableListState, listFocusNext, listFocusPrev, listPageDown, listPageUp } from './browsable-list.js';

describe('browsableList', () => {
  const items = [
      { label: 'Apple', value: 'apple' },
      { label: 'Banana', value: 'banana', description: 'Yellow fruit' },
      { label: 'Cherry', value: 'cherry' },
      { label: 'Date', value: 'date' },
      { label: 'Elderberry', value: 'elderberry' },
    ];

  describe('createBrowsableListState()', () => {
      it('creates state with defaults', () => {
        const state = createBrowsableListState({ items });
        expect(state.focusIndex).toBe(0);
        expect(state.scrollY).toBe(0);
        expect(state.height).toBe(10);
        expect(state.items).toEqual(items);
      });

      it('accepts custom height', () => {
        const state = createBrowsableListState({ items, height: 3 });
        expect(state.height).toBe(3);
      });

      it('clamps height to 1 when 0 is provided', () => {
        const state = createBrowsableListState({ items, height: 0 });
        expect(state.height).toBe(1);
      });

      it('clamps negative height to 1', () => {
        const state = createBrowsableListState({ items, height: -5 });
        expect(state.height).toBe(1);
      });

      it('falls back for non-finite height and floors fractional height', () => {
        expect(createBrowsableListState({ items, height: Number.NaN }).height).toBe(10);
        expect(createBrowsableListState({ items, height: 3.8 }).height).toBe(3);
      });
    });

  describe('focus navigation', () => {
      it('focusNext moves to next item', () => {
        const state = createBrowsableListState({ items });
        const next = listFocusNext(state);
        expect(next.focusIndex).toBe(1);
      });

      it('focusNext wraps around', () => {
        let state = createBrowsableListState({ items });
        for (let remaining = items.length; remaining > 0; remaining -= 1) state = listFocusNext(state);
        expect(state.focusIndex).toBe(0);
      });

      it('focusPrev moves to previous item', () => {
        let state = createBrowsableListState({ items });
        state = listFocusNext(state);
        state = listFocusPrev(state);
        expect(state.focusIndex).toBe(0);
      });

      it('focusPrev wraps around', () => {
        const state = createBrowsableListState({ items });
        const prev = listFocusPrev(state);
        expect(prev.focusIndex).toBe(items.length - 1);
      });

      it('empty list is a no-op', () => {
        const state = createBrowsableListState({ items: [] });
        expect(listFocusNext(state)).toBe(state);
        expect(listFocusPrev(state)).toBe(state);
      });
    });

  describe('page navigation', () => {
      it('pageDown moves by height', () => {
        const state = createBrowsableListState({ items, height: 2 });
        const paged = listPageDown(state);
        expect(paged.focusIndex).toBe(2);
      });

      it('pageDown clamps to last item', () => {
        const state = createBrowsableListState({ items, height: 10 });
        const paged = listPageDown(state);
        expect(paged.focusIndex).toBe(items.length - 1);
      });

      it('pageUp clamps to first item', () => {
        const state = createBrowsableListState({ items, height: 10 });
        const paged = listPageUp(state);
        expect(paged.focusIndex).toBe(0);
      });
    });

  describe('scroll follows focus', () => {
      it('scrollY adjusts when focus goes below viewport', () => {
        let state = createBrowsableListState({ items, height: 2 });
        state = listFocusNext(state);
        state = listFocusNext(state);
        expect(state.scrollY).toBe(1);
      });

      it('scrollY adjusts when focus wraps to top', () => {
        let state = createBrowsableListState({ items, height: 2 });
        for (let remaining = items.length; remaining > 0; remaining -= 1) state = listFocusNext(state);
        expect(state.focusIndex).toBe(0);
        expect(state.scrollY).toBe(0);
      });
    });
});
