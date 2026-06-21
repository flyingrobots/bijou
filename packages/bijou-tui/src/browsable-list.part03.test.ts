import { describe, it, expect } from 'vitest';
import { browsableListKeyMap } from './browsable-list.js';

describe('browsableList', () => {
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
        expect(km.handle({ type: 'key', key: 'j', ctrl: false, alt: false, shift: false })).toBe('next');
        expect(km.handle({ type: 'key', key: 'k', ctrl: false, alt: false, shift: false })).toBe('prev');
        expect(km.handle({ type: 'key', key: 'enter', ctrl: false, alt: false, shift: false })).toBe('sel');
        expect(km.handle({ type: 'key', key: 'q', ctrl: false, alt: false, shift: false })).toBe('q');
      });
    });
});
