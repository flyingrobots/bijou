import { describe, it, expect } from 'vitest';
import {
  rgbToAnsi256,
  nearestAnsi256,
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
