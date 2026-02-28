import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToHex,
  lighten,
  darken,
  mix,
  complementary,
  saturate,
  desaturate,
} from './color.js';
import type { TokenValue } from './tokens.js';

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
});

// ── rgbToHex ───────────────────────────────────────────────────────

describe('rgbToHex', () => {
  it('converts RGB to hex string', () => {
    expect(rgbToHex([255, 0, 0])).toBe('#ff0000');
  });

  it('round-trips with hexToRgb', () => {
    expect(rgbToHex(hexToRgb('#abcdef'))).toBe('#abcdef');
  });

  it('clamps out-of-range values', () => {
    expect(rgbToHex([300, -10, 128])).toBe('#ff0080');
  });
});

// ── lighten ────────────────────────────────────────────────────────

describe('lighten', () => {
  const red: TokenValue = { hex: '#ff0000' };

  it('amount 0 returns unchanged color', () => {
    expect(lighten(red, 0).hex).toBe('#ff0000');
  });

  it('amount 1 returns white', () => {
    expect(lighten(red, 1).hex).toBe('#ffffff');
  });

  it('amount 0.5 returns midpoint toward white', () => {
    const result = lighten(red, 0.5);
    expect(hexToRgb(result.hex)).toEqual([255, 128, 128]);
  });

  it('preserves modifiers', () => {
    const bold: TokenValue = { hex: '#ff0000', modifiers: ['bold'] };
    const result = lighten(bold, 0.5);
    expect(result.modifiers).toEqual(['bold']);
  });

  it('does not mutate input modifiers array', () => {
    const mods: ('bold' | 'dim')[] = ['bold'];
    const token: TokenValue = { hex: '#ff0000', modifiers: mods };
    const result = lighten(token, 0.5);
    expect(result.modifiers).not.toBe(mods);
  });
});

// ── darken ─────────────────────────────────────────────────────────

describe('darken', () => {
  const red: TokenValue = { hex: '#ff0000' };

  it('amount 0 returns unchanged color', () => {
    expect(darken(red, 0).hex).toBe('#ff0000');
  });

  it('amount 1 returns black', () => {
    expect(darken(red, 1).hex).toBe('#000000');
  });

  it('clamps amount above 1', () => {
    expect(darken(red, 2).hex).toBe('#000000');
  });

  it('clamps amount below 0', () => {
    expect(darken(red, -1).hex).toBe('#ff0000');
  });
});

// ── mix ────────────────────────────────────────────────────────────

describe('mix', () => {
  const red: TokenValue = { hex: '#ff0000' };
  const blue: TokenValue = { hex: '#0000ff' };

  it('ratio 0 returns first color', () => {
    expect(mix(red, blue, 0).hex).toBe('#ff0000');
  });

  it('ratio 1 returns second color', () => {
    expect(mix(red, blue, 1).hex).toBe('#0000ff');
  });

  it('default ratio 0.5 mixes evenly', () => {
    const result = mix(red, blue);
    expect(hexToRgb(result.hex)).toEqual([128, 0, 128]);
  });

  it('preserves modifiers from first argument', () => {
    const boldRed: TokenValue = { hex: '#ff0000', modifiers: ['bold'] };
    const result = mix(boldRed, blue);
    expect(result.modifiers).toEqual(['bold']);
  });
});

// ── complementary ──────────────────────────────────────────────────

describe('complementary', () => {
  it('red → cyan', () => {
    const red: TokenValue = { hex: '#ff0000' };
    const result = complementary(red);
    const [r, g, b] = hexToRgb(result.hex);
    expect(r).toBe(0);
    expect(g).toBe(255);
    expect(b).toBe(255);
  });

  it('preserves modifiers', () => {
    const dimRed: TokenValue = { hex: '#ff0000', modifiers: ['dim'] };
    const result = complementary(dimRed);
    expect(result.modifiers).toEqual(['dim']);
  });

  it('gray stays gray (achromatic)', () => {
    const gray: TokenValue = { hex: '#808080' };
    const result = complementary(gray);
    // Gray has no saturation, so complementary should return the same gray
    const [r, g, b] = hexToRgb(result.hex);
    expect(r).toBe(g);
    expect(g).toBe(b);
  });
});

// ── saturate ───────────────────────────────────────────────────────

describe('saturate', () => {
  it('amount 0 returns unchanged', () => {
    const muted: TokenValue = { hex: '#996666' };
    expect(saturate(muted, 0).hex).toBe('#996666');
  });

  it('amount 1 fully saturates', () => {
    const muted: TokenValue = { hex: '#996666' };
    const result = saturate(muted, 1);
    const [r, g, b] = hexToRgb(result.hex);
    // Should be more saturated — distance from gray increases
    const maxChannel = Math.max(r, g, b);
    const minChannel = Math.min(r, g, b);
    expect(maxChannel - minChannel).toBeGreaterThan(0x99 - 0x66);
  });
});

// ── desaturate ─────────────────────────────────────────────────────

describe('desaturate', () => {
  it('amount 0 returns unchanged', () => {
    const red: TokenValue = { hex: '#ff0000' };
    expect(desaturate(red, 0).hex).toBe('#ff0000');
  });

  it('amount 1 fully desaturates to gray', () => {
    const red: TokenValue = { hex: '#ff0000' };
    const result = desaturate(red, 1);
    const [r, g, b] = hexToRgb(result.hex);
    // Fully desaturated: all channels should be equal
    expect(r).toBe(g);
    expect(g).toBe(b);
  });

  it('preserves modifiers', () => {
    const bold: TokenValue = { hex: '#ff0000', modifiers: ['bold', 'dim'] };
    const result = desaturate(bold, 0.5);
    expect(result.modifiers).toEqual(['bold', 'dim']);
  });
});
