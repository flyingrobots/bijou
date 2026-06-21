import { describe, it, expect } from 'vitest';
import { hexToRgb } from './color.js';

// ── hexToRgb ───────────────────────────────────────────────────────

describe('hexToRgb', () => {
  it('parses 6-digit hex with #', () => {
    expect(hexToRgb('#ff0000')).toEqual([255, 0, 0]);
  });

  it('parses 6-digit hex without #', () => {
    expect(hexToRgb('00ff00')).toEqual([0, 255, 0]);
  });

  it('parses 3-digit shorthand with #', () => {
    expect(hexToRgb('#f00')).toEqual([255, 0, 0]);
  });

  it('parses 3-digit shorthand without #', () => {
    expect(hexToRgb('0f0')).toEqual([0, 255, 0]);
  });
  it('throws on invalid length (too short)', () => {
    expect(() => hexToRgb('#ab')).toThrow('Invalid hex color');
  });

  it('throws on invalid length (too long)', () => {
    expect(() => hexToRgb('#1234567')).toThrow('Invalid hex color');
  });

  it('throws on empty string', () => {
    expect(() => hexToRgb('')).toThrow('Invalid hex color');
  });

  it('throws on 4-digit hex', () => {
    expect(() => hexToRgb('#abcd')).toThrow('Invalid hex color');
  });

  it('throws on non-hex characters', () => {
    expect(() => hexToRgb('xyz')).toThrow('Invalid hex color');
    expect(() => hexToRgb('#gggggg')).toThrow('Invalid hex color');
  });
});
