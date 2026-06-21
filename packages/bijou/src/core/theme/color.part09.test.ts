import { describe, it, expect } from 'vitest';
import { hexToRgb, desaturate } from './color.js';
import type { TokenValue } from './tokens.js';

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
