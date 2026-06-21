import { describe, it, expect } from 'vitest';
import { parseMouse } from './keys.js';

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
    expect(msg?.shift).toBe(true);
    expect(msg?.alt).toBe(false);
    expect(msg?.ctrl).toBe(false);
  });

  it('extracts alt modifier', () => {
    // 0 + 8 (alt) = 8
    const msg = parseMouse('\x1b[<8;1;1M');
    expect(msg?.alt).toBe(true);
    expect(msg?.shift).toBe(false);
    expect(msg?.ctrl).toBe(false);
  });

  it('extracts ctrl modifier', () => {
    // 0 + 16 (ctrl) = 16
    const msg = parseMouse('\x1b[<16;1;1M');
    expect(msg?.ctrl).toBe(true);
    expect(msg?.shift).toBe(false);
    expect(msg?.alt).toBe(false);
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
    expect(msg?.col).toBe(0);
    expect(msg?.row).toBe(0);
  });

  it('rejects malformed zero coordinates', () => {
    expect(parseMouse('\x1b[<0;0;1M')).toBeNull();
    expect(parseMouse('\x1b[<0;1;0M')).toBeNull();
    expect(parseMouse('\x1b[<0;0;0M')).toBeNull();
  });
});
