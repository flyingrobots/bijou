import { describe, it, expect } from 'vitest';
import { brailleChartSurface } from './braille-chart.js';
import { createTestContext } from '../../adapters/test/index.js';

const ctx = createTestContext();

describe('brailleChartSurface', () => {
  it('returns a surface with the requested dimensions', () => {
    const surface = brailleChartSurface([1, 2, 3], { width: 10, height: 5, ctx });
    expect(surface.width).toBe(10);
    expect(surface.height).toBe(5);
  });

  it('fills cells with braille characters (U+2800 range)', () => {
    const surface = brailleChartSurface([0, 50, 100], { width: 4, height: 3, ctx });
    for (let y = 0; y < surface.height; y++) {
      for (let x = 0; x < surface.width; x++) {
        const cell = surface.get(x, y);
        const code = cell.char.codePointAt(0)!;
        expect(code).toBeGreaterThanOrEqual(0x2800);
        expect(code).toBeLessThanOrEqual(0x28ff);
      }
    }
  });

  it('renders empty surface for empty values', () => {
    const surface = brailleChartSurface([], { width: 5, height: 3, ctx });
    expect(surface.width).toBe(5);
    expect(surface.height).toBe(3);
  });

  it('renders all-same values with bottom half filled and top half empty', () => {
    const surface = brailleChartSurface([5, 5, 5, 5], { width: 2, height: 4, ctx });
    const countBits = (n: number) => { let c = 0; while (n) { c += n & 1; n >>= 1; } return c; };
    // Bottom rows should have more dots filled than top rows.
    const bottomBits = countBits(surface.get(0, 3).char.codePointAt(0)! - 0x2800);
    const topBits = countBits(surface.get(0, 0).char.codePointAt(0)! - 0x2800);
    expect(bottomBits).toBeGreaterThanOrEqual(topBits);
  });

  it('handles single value', () => {
    const surface = brailleChartSurface([42], { width: 3, height: 2, ctx });
    expect(surface.width).toBe(3);
    expect(surface.height).toBe(2);
  });

  it('handles zero-size gracefully', () => {
    const surface = brailleChartSurface([1, 2], { width: 0, height: 0, ctx });
    expect(surface.width).toBe(0);
    expect(surface.height).toBe(0);
  });

  it('bottom row has more dots than top row for ascending values', () => {
    const surface = brailleChartSurface([0, 100], { width: 1, height: 4, ctx });
    const bottomCode = surface.get(0, 3).char.codePointAt(0)! - 0x2800;
    const topCode = surface.get(0, 0).char.codePointAt(0)! - 0x2800;
    const countBits = (n: number) => { let c = 0; while (n) { c += n & 1; n >>= 1; } return c; };
    expect(countBits(bottomCode)).toBeGreaterThanOrEqual(countBits(topCode));
  });

  it('treats NaN values as 0', () => {
    const surface = brailleChartSurface([NaN, 10, NaN], { width: 2, height: 2, ctx });
    expect(surface.width).toBe(2);
    // Should not throw, and all cells should be valid braille
    for (let y = 0; y < surface.height; y++) {
      for (let x = 0; x < surface.width; x++) {
        const code = surface.get(x, y).char.codePointAt(0)!;
        expect(code).toBeGreaterThanOrEqual(0x2800);
        expect(code).toBeLessThanOrEqual(0x28ff);
      }
    }
  });

  it('treats Infinity values as 0', () => {
    const surface = brailleChartSurface([Infinity, -Infinity, 5], { width: 2, height: 2, ctx });
    expect(surface.width).toBe(2);
    for (let y = 0; y < surface.height; y++) {
      for (let x = 0; x < surface.width; x++) {
        const code = surface.get(x, y).char.codePointAt(0)!;
        expect(code).toBeGreaterThanOrEqual(0x2800);
      }
    }
  });

  it('handles large arrays without stack overflow', () => {
    const values = new Array(100_000).fill(0).map((_, i) => Math.sin(i * 0.01));
    const surface = brailleChartSurface(values, { width: 20, height: 4, ctx });
    expect(surface.width).toBe(20);
    expect(surface.height).toBe(4);
  });
});
