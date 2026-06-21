import { describe, it, expect } from 'vitest';
import { parseKey } from './keys.js';

describe('parseKey', () => {
  describe('F-keys with modifiers (CSI ; encoding)', () => {
      it('parses Shift+F1 through Shift+F4', () => {
        // CSI 1;2P = Shift+F1, etc.
        expect(parseKey('\x1b[1;2P')).toEqual({ type: 'key', key: 'f1', ctrl: false, alt: false, shift: true });
        expect(parseKey('\x1b[1;2Q')).toEqual({ type: 'key', key: 'f2', ctrl: false, alt: false, shift: true });
        expect(parseKey('\x1b[1;2R')).toEqual({ type: 'key', key: 'f3', ctrl: false, alt: false, shift: true });
        expect(parseKey('\x1b[1;2S')).toEqual({ type: 'key', key: 'f4', ctrl: false, alt: false, shift: true });
      });

      it('parses Ctrl+F1', () => {
        // modifier 5 = ctrl
        expect(parseKey('\x1b[1;5P')).toEqual({ type: 'key', key: 'f1', ctrl: true, alt: false, shift: false });
      });

      it('parses Alt+F1', () => {
        // modifier 3 = alt
        expect(parseKey('\x1b[1;3P')).toEqual({ type: 'key', key: 'f1', ctrl: false, alt: true, shift: false });
      });

      it('parses Ctrl+Shift+F2', () => {
        // modifier 6 = ctrl+shift
        expect(parseKey('\x1b[1;6Q')).toEqual({ type: 'key', key: 'f2', ctrl: true, alt: false, shift: true });
      });

      it('parses Shift+F5 through Shift+F12 (CSI code;2~)', () => {
        // Shift+F5 = \x1b[15;2~, Shift+F6 = \x1b[17;2~, etc.
        expect(parseKey('\x1b[15;2~')).toEqual({ type: 'key', key: 'f5', ctrl: false, alt: false, shift: true });
        expect(parseKey('\x1b[24;2~')).toEqual({ type: 'key', key: 'f12', ctrl: false, alt: false, shift: true });
      });

      it('parses Ctrl+F8 (CSI code;5~)', () => {
        expect(parseKey('\x1b[19;5~')).toEqual({ type: 'key', key: 'f8', ctrl: true, alt: false, shift: false });
      });
    });

  describe('unrecognized', () => {
      it('returns unknown for unrecognized sequences', () => {
        expect(parseKey('\x1b[999~')).toEqual({ type: 'key', key: 'unknown', ctrl: false, alt: false, shift: false });
      });
      it('returns unknown for multi-byte characters', () => {
        expect(parseKey('\xc3\xa9')).toEqual({ type: 'key', key: 'unknown', ctrl: false, alt: false, shift: false });
      });
    });
});
