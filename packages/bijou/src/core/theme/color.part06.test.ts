import { describe, it, expect } from 'vitest';
import { hexToRgb, mix } from './color.js';
import type { TokenValue } from './tokens.js';

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
