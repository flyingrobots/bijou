import { describe, it, expect } from 'vitest';
import { hexToRgb, lighten } from './color.js';
import type { TokenValue } from './tokens.js';

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
