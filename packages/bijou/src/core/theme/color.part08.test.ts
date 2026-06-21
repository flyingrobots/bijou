import { describe, it, expect } from 'vitest';
import { hexToRgb, saturate } from './color.js';
import type { TokenValue } from './tokens.js';

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
