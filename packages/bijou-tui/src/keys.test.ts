import { describe, it, expect } from 'vitest';
import { parseKey, parseMouse } from './keys.js';

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

describe('parseMouse', () => {
  it('parses SGR left press', () => {
    const msg = parseMouse('\x1b[<0;10;20M');
    expect(msg).toEqual({
      type: 'mouse', button: 'left', action: 'press',
      col: 9, row: 19, shift: false, alt: false, ctrl: false,
    });
  });

  it('parses SGR middle press', () => {
    const msg = parseMouse('\x1b[<1;5;5M');
    expect(msg).toEqual({
      type: 'mouse', button: 'middle', action: 'press',
      col: 4, row: 4, shift: false, alt: false, ctrl: false,
    });
  });

  it('parses SGR right press', () => {
    const msg = parseMouse('\x1b[<2;1;1M');
    expect(msg).toEqual({
      type: 'mouse', button: 'right', action: 'press',
      col: 0, row: 0, shift: false, alt: false, ctrl: false,
    });
  });

  it('parses release (m suffix)', () => {
    const msg = parseMouse('\x1b[<0;10;20m');
    expect(msg).toEqual({
      type: 'mouse', button: 'left', action: 'release',
      col: 9, row: 19, shift: false, alt: false, ctrl: false,
    });
  });

  it('parses scroll up', () => {
    const msg = parseMouse('\x1b[<64;10;20M');
    expect(msg).toEqual({
      type: 'mouse', button: 'none', action: 'scroll-up',
      col: 9, row: 19, shift: false, alt: false, ctrl: false,
    });
  });

  it('parses scroll down', () => {
    const msg = parseMouse('\x1b[<65;10;20M');
    expect(msg).toEqual({
      type: 'mouse', button: 'none', action: 'scroll-down',
      col: 9, row: 19, shift: false, alt: false, ctrl: false,
    });
  });

  it('extracts shift modifier', () => {
    // 0 + 4 (shift) = 4
    const msg = parseMouse('\x1b[<4;1;1M');
    expect(msg!.shift).toBe(true);
    expect(msg!.alt).toBe(false);
    expect(msg!.ctrl).toBe(false);
  });

  it('extracts alt modifier', () => {
    // 0 + 8 (alt) = 8
    const msg = parseMouse('\x1b[<8;1;1M');
    expect(msg!.alt).toBe(true);
    expect(msg!.shift).toBe(false);
    expect(msg!.ctrl).toBe(false);
  });

  it('extracts ctrl modifier', () => {
    // 0 + 16 (ctrl) = 16
    const msg = parseMouse('\x1b[<16;1;1M');
    expect(msg!.ctrl).toBe(true);
    expect(msg!.shift).toBe(false);
    expect(msg!.alt).toBe(false);
  });

  it('parses drag (motion) events', () => {
    // 32 (motion) + 0 (left) = 32
    const msg = parseMouse('\x1b[<32;10;20M');
    expect(msg).toEqual({
      type: 'mouse', button: 'left', action: 'move',
      col: 9, row: 19, shift: false, alt: false, ctrl: false,
    });
  });

  it('returns null for non-mouse sequences', () => {
    expect(parseMouse('\x1b[A')).toBeNull();
    expect(parseMouse('hello')).toBeNull();
    expect(parseMouse('')).toBeNull();
  });

  it('coords are 0-based', () => {
    // SGR reports 1-based coords
    const msg = parseMouse('\x1b[<0;1;1M');
    expect(msg!.col).toBe(0);
    expect(msg!.row).toBe(0);
  });

  it('rejects malformed zero coordinates', () => {
    expect(parseMouse('\x1b[<0;0;1M')).toBeNull();
    expect(parseMouse('\x1b[<0;1;0M')).toBeNull();
    expect(parseMouse('\x1b[<0;0;0M')).toBeNull();
  });
});
