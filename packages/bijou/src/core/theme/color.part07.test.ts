import { describe, it, expect } from 'vitest';
import { hexToRgb, complementary } from './color.js';
import type { TokenValue } from './tokens.js';

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
