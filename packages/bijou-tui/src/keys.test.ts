import { describe, it, expect } from 'vitest';
import { parseKey } from './keys.js';

describe('parseKey', () => {
  describe('arrow keys', () => {
    it('parses up arrow', () => {
      expect(parseKey('\x1b[A')).toEqual({ type: 'key', key: 'up', ctrl: false, alt: false, shift: false });
    });
    it('parses down arrow', () => {
      expect(parseKey('\x1b[B')).toEqual({ type: 'key', key: 'down', ctrl: false, alt: false, shift: false });
    });
    it('parses right arrow', () => {
      expect(parseKey('\x1b[C')).toEqual({ type: 'key', key: 'right', ctrl: false, alt: false, shift: false });
    });
    it('parses left arrow', () => {
      expect(parseKey('\x1b[D')).toEqual({ type: 'key', key: 'left', ctrl: false, alt: false, shift: false });
    });
  });

  describe('special keys', () => {
    it('parses enter (\\r)', () => {
      expect(parseKey('\r')).toEqual({ type: 'key', key: 'enter', ctrl: false, alt: false, shift: false });
    });
    it('parses enter (\\n)', () => {
      expect(parseKey('\n')).toEqual({ type: 'key', key: 'enter', ctrl: false, alt: false, shift: false });
    });
    it('parses tab', () => {
      expect(parseKey('\t')).toEqual({ type: 'key', key: 'tab', ctrl: false, alt: false, shift: false });
    });
    it('parses shift-tab', () => {
      expect(parseKey('\x1b[Z')).toEqual({ type: 'key', key: 'tab', ctrl: false, alt: false, shift: true });
    });
    it('parses backspace', () => {
      expect(parseKey('\x7f')).toEqual({ type: 'key', key: 'backspace', ctrl: false, alt: false, shift: false });
    });
    it('parses space', () => {
      expect(parseKey(' ')).toEqual({ type: 'key', key: 'space', ctrl: false, alt: false, shift: false });
    });
    it('parses escape', () => {
      expect(parseKey('\x1b')).toEqual({ type: 'key', key: 'escape', ctrl: false, alt: false, shift: false });
    });
    it('parses home', () => {
      expect(parseKey('\x1b[H')).toEqual({ type: 'key', key: 'home', ctrl: false, alt: false, shift: false });
    });
    it('parses end', () => {
      expect(parseKey('\x1b[F')).toEqual({ type: 'key', key: 'end', ctrl: false, alt: false, shift: false });
    });
    it('parses delete', () => {
      expect(parseKey('\x1b[3~')).toEqual({ type: 'key', key: 'delete', ctrl: false, alt: false, shift: false });
    });
    it('parses page up', () => {
      expect(parseKey('\x1b[5~')).toEqual({ type: 'key', key: 'pageup', ctrl: false, alt: false, shift: false });
    });
    it('parses page down', () => {
      expect(parseKey('\x1b[6~')).toEqual({ type: 'key', key: 'pagedown', ctrl: false, alt: false, shift: false });
    });
  });

  describe('ctrl combinations', () => {
    it('parses Ctrl+C', () => {
      expect(parseKey('\x03')).toEqual({ type: 'key', key: 'c', ctrl: true, alt: false, shift: false });
    });
    it('parses Ctrl+A', () => {
      expect(parseKey('\x01')).toEqual({ type: 'key', key: 'a', ctrl: true, alt: false, shift: false });
    });
    it('parses Ctrl+Z', () => {
      expect(parseKey('\x1a')).toEqual({ type: 'key', key: 'z', ctrl: true, alt: false, shift: false });
    });
    it('parses Ctrl+L', () => {
      expect(parseKey('\x0c')).toEqual({ type: 'key', key: 'l', ctrl: true, alt: false, shift: false });
    });
  });

  describe('printable characters', () => {
    it('parses lowercase letters', () => {
      expect(parseKey('a')).toEqual({ type: 'key', key: 'a', ctrl: false, alt: false, shift: false });
      expect(parseKey('z')).toEqual({ type: 'key', key: 'z', ctrl: false, alt: false, shift: false });
    });
    it('parses digits', () => {
      expect(parseKey('0')).toEqual({ type: 'key', key: '0', ctrl: false, alt: false, shift: false });
      expect(parseKey('9')).toEqual({ type: 'key', key: '9', ctrl: false, alt: false, shift: false });
    });
    it('parses uppercase letters', () => {
      expect(parseKey('A')).toEqual({ type: 'key', key: 'A', ctrl: false, alt: false, shift: false });
    });
    it('parses punctuation', () => {
      expect(parseKey('/')).toEqual({ type: 'key', key: '/', ctrl: false, alt: false, shift: false });
      expect(parseKey('?')).toEqual({ type: 'key', key: '?', ctrl: false, alt: false, shift: false });
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
