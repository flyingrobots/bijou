import { describe, expect, it } from 'vitest';
import { ansi256ToAnsi16, rgbToAnsi16 } from './downsample.js';

describe('rgbToAnsi16', () => {
  it('maps canonical bright and dark colors', () => {
    expect(rgbToAnsi16(0, 0, 0)).toBe(0);
    expect(rgbToAnsi16(255, 255, 255)).toBe(15);
    expect(rgbToAnsi16(255, 0, 0)).toBe(9);
    expect(rgbToAnsi16(0, 255, 0)).toBe(10);
    expect(rgbToAnsi16(0, 0, 255)).toBe(12);
    expect(rgbToAnsi16(255, 255, 0)).toBe(11);
    expect(rgbToAnsi16(0, 255, 255)).toBe(14);
    expect(rgbToAnsi16(255, 0, 255)).toBe(13);
    expect(rgbToAnsi16(128, 0, 0)).toBe(1);
    expect(rgbToAnsi16(0, 128, 0)).toBe(2);
    expect(rgbToAnsi16(192, 192, 192)).toBe(7);
    expect(rgbToAnsi16(128, 128, 128)).toBe(8);
  });

  it('returns valid range (0-15)', () => {
    for (let r = 0; r <= 255; r += 51) {
      for (let g = 0; g <= 255; g += 51) {
        for (let b = 0; b <= 255; b += 51) {
          const idx = rgbToAnsi16(r, g, b);
          expect(idx).toBeGreaterThanOrEqual(0);
          expect(idx).toBeLessThanOrEqual(15);
        }
      }
    }
  });
});

describe('ansi256ToAnsi16', () => {
  it('passes through standard colors (0-15)', () => {
    for (let i = 0; i < 16; i++) {
      expect(ansi256ToAnsi16(i)).toBe(i);
    }
  });

  it('maps cube and grayscale entries to closest ANSI 16', () => {
    expect(ansi256ToAnsi16(196)).toBe(9);
    expect(ansi256ToAnsi16(46)).toBe(10);
    expect(ansi256ToAnsi16(21)).toBe(12);
    expect(ansi256ToAnsi16(232)).toBe(0);
    expect(ansi256ToAnsi16(255)).toBe(15);
  });

  it('returns valid range (0-15)', () => {
    for (let i = 16; i <= 255; i++) {
      const idx = ansi256ToAnsi16(i);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThanOrEqual(15);
    }
  });
});
