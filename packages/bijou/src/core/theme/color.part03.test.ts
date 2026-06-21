import { describe, it, expect } from 'vitest';
import { hexToRgb, rgbToHex } from './color.js';

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
