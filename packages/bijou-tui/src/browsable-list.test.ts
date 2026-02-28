import { describe, it, expect } from 'vitest';
import {
  createBrowsableListState,
  listFocusNext,
  listFocusPrev,
  listPageDown,
  listPageUp,
  browsableList,
  browsableListKeyMap,
} from './browsable-list.js';

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
  });

  describe('focus navigation', () => {
    it('focusNext moves to next item', () => {
      const state = createBrowsableListState({ items });
      const next = listFocusNext(state);
      expect(next.focusIndex).toBe(1);
    });

    it('focusNext wraps around', () => {
      let state = createBrowsableListState({ items });
      for (let i = 0; i < items.length; i++) state = listFocusNext(state);
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
      for (let i = 0; i < items.length; i++) state = listFocusNext(state);
      expect(state.focusIndex).toBe(0);
      expect(state.scrollY).toBe(0);
    });
  });

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
  });

  describe('keymap', () => {
    it('dispatches correct actions', () => {
      const actions = {
        focusNext: 'next',
        focusPrev: 'prev',
        pageDown: 'pd',
        pageUp: 'pu',
        select: 'sel',
        quit: 'q',
      };
      const km = browsableListKeyMap(actions);
      expect(km.handle({ key: 'j', ctrl: false, alt: false, shift: false })).toBe('next');
      expect(km.handle({ key: 'k', ctrl: false, alt: false, shift: false })).toBe('prev');
      expect(km.handle({ key: 'enter', ctrl: false, alt: false, shift: false })).toBe('sel');
      expect(km.handle({ key: 'q', ctrl: false, alt: false, shift: false })).toBe('q');
    });
  });
});
