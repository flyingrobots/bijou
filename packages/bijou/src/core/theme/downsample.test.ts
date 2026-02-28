import { describe, it, expect } from 'vitest';
import {
  rgbToAnsi256,
  nearestAnsi256,
  rgbToAnsi16,
  ansi256ToAnsi16,
} from './downsample.js';

describe('rgbToAnsi256', () => {
  it('maps pure black', () => {
    expect(rgbToAnsi256(0, 0, 0)).toBe(16);
  });

  it('maps pure white', () => {
    expect(rgbToAnsi256(255, 255, 255)).toBe(231);
  });

  it('maps pure red to cube index', () => {
    expect(rgbToAnsi256(255, 0, 0)).toBe(196); // 16 + 36*5 + 6*0 + 0
  });

  it('maps pure green to cube index', () => {
    expect(rgbToAnsi256(0, 255, 0)).toBe(46); // 16 + 36*0 + 6*5 + 0
  });

  it('maps pure blue to cube index', () => {
    expect(rgbToAnsi256(0, 0, 255)).toBe(21); // 16 + 36*0 + 6*0 + 5
  });

  it('maps mid-gray to grayscale ramp', () => {
    const idx = rgbToAnsi256(128, 128, 128);
    expect(idx).toBeGreaterThanOrEqual(232);
    expect(idx).toBeLessThanOrEqual(255);
  });

  it('maps near-black gray to grayscale', () => {
    const idx = rgbToAnsi256(10, 10, 10);
    expect(idx).toBeGreaterThanOrEqual(232);
  });

  it('maps near-white gray to grayscale', () => {
    const idx = rgbToAnsi256(250, 250, 250);
    expect(idx).toBe(231); // close to white
  });
});

describe('nearestAnsi256', () => {
  it('returns same as rgbToAnsi256 for pure colors', () => {
    expect(nearestAnsi256(255, 0, 0)).toBe(196);
    expect(nearestAnsi256(0, 255, 0)).toBe(46);
    expect(nearestAnsi256(0, 0, 255)).toBe(21);
  });

  it('maps pure grayscale to grayscale ramp', () => {
    const idx = nearestAnsi256(100, 100, 100);
    expect(idx).toBeGreaterThanOrEqual(232);
    expect(idx).toBeLessThanOrEqual(255);
  });

  it('returns valid index range (16-255)', () => {
    for (let r = 0; r <= 255; r += 85) {
      for (let g = 0; g <= 255; g += 85) {
        for (let b = 0; b <= 255; b += 85) {
          const idx = nearestAnsi256(r, g, b);
          expect(idx).toBeGreaterThanOrEqual(16);
          expect(idx).toBeLessThanOrEqual(255);
        }
      }
    }
  });
});

describe('rgbToAnsi16', () => {
  it('maps black to 0', () => {
    expect(rgbToAnsi16(0, 0, 0)).toBe(0);
  });

  it('maps white to 15', () => {
    expect(rgbToAnsi16(255, 255, 255)).toBe(15);
  });

  it('maps bright red to 9', () => {
    expect(rgbToAnsi16(255, 0, 0)).toBe(9);
  });

  it('maps bright green to 10', () => {
    expect(rgbToAnsi16(0, 255, 0)).toBe(10);
  });

  it('maps bright blue to 12', () => {
    expect(rgbToAnsi16(0, 0, 255)).toBe(12);
  });

  it('maps bright yellow to 11', () => {
    expect(rgbToAnsi16(255, 255, 0)).toBe(11);
  });

  it('maps bright cyan to 14', () => {
    expect(rgbToAnsi16(0, 255, 255)).toBe(14);
  });

  it('maps bright magenta to 13', () => {
    expect(rgbToAnsi16(255, 0, 255)).toBe(13);
  });

  it('maps dark red to 1', () => {
    expect(rgbToAnsi16(128, 0, 0)).toBe(1);
  });

  it('maps dark green to 2', () => {
    expect(rgbToAnsi16(0, 128, 0)).toBe(2);
  });

  it('maps light gray to 7', () => {
    expect(rgbToAnsi16(192, 192, 192)).toBe(7);
  });

  it('maps dark gray to 8', () => {
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

  it('maps cube red (196) to bright red (9)', () => {
    expect(ansi256ToAnsi16(196)).toBe(9);
  });

  it('maps cube green (46) to bright green (10)', () => {
    expect(ansi256ToAnsi16(46)).toBe(10);
  });

  it('maps cube blue (21) to bright blue (12)', () => {
    expect(ansi256ToAnsi16(21)).toBe(12);
  });

  it('maps grayscale entries to closest ANSI 16', () => {
    // Very dark gray (232) should map to black (0)
    expect(ansi256ToAnsi16(232)).toBe(0);
    // Very light gray (255) should map to white (15)
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
