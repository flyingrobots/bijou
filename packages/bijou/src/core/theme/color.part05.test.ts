import { describe, it, expect } from 'vitest';
import { darken } from './color.js';
import type { TokenValue } from './tokens.js';

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
