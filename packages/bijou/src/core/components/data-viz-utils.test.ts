import { describe, it, expect } from 'vitest';
import { sanitizeValues, safeMin, safeMax, sampleToWidth } from './data-viz-utils.js';

describe('sanitizeValues', () => {
  it('returns the same array when all values are finite', () => {
    const values = [1, 2, 3];
    expect(sanitizeValues(values)).toBe(values); // same reference
  });

  it('replaces NaN with 0', () => {
    expect(sanitizeValues([1, NaN, 3])).toEqual([1, 0, 3]);
  });

  it('replaces Infinity and -Infinity with 0', () => {
    expect(sanitizeValues([Infinity, 1, -Infinity])).toEqual([0, 1, 0]);
  });

  it('handles all-NaN input', () => {
    expect(sanitizeValues([NaN, NaN, NaN])).toEqual([0, 0, 0]);
  });

  it('handles empty array', () => {
    expect(sanitizeValues([])).toEqual([]);
  });
});

describe('safeMin', () => {
  it('returns the minimum value', () => {
    expect(safeMin([3, 1, 4, 1, 5])).toBe(1);
  });

  it('returns Infinity for empty array', () => {
    expect(safeMin([])).toBe(Infinity);
  });

  it('handles negative values', () => {
    expect(safeMin([-10, 0, 10])).toBe(-10);
  });

  it('handles single element', () => {
    expect(safeMin([42])).toBe(42);
  });
});

describe('safeMax', () => {
  it('returns the maximum value', () => {
    expect(safeMax([3, 1, 4, 1, 5])).toBe(5);
  });

  it('returns -Infinity for empty array', () => {
    expect(safeMax([])).toBe(-Infinity);
  });

  it('handles negative values', () => {
    expect(safeMax([-10, -5, -1])).toBe(-1);
  });

  it('handles single element', () => {
    expect(safeMax([42])).toBe(42);
  });
});

describe('sampleToWidth', () => {
  it('returns empty array for count 0', () => {
    expect(sampleToWidth([1, 2, 3], 0)).toEqual([]);
  });

  it('returns empty array for negative count', () => {
    expect(sampleToWidth([1, 2, 3], -1)).toEqual([]);
  });

  it('returns zeros for empty input', () => {
    expect(sampleToWidth([], 3)).toEqual([0, 0, 0]);
  });

  it('returns a copy when count equals length', () => {
    const values = [1, 2, 3];
    const result = sampleToWidth(values, 3);
    expect(result).toEqual([1, 2, 3]);
    expect(result).not.toBe(values); // new array
  });

  it('averages buckets when downsampling', () => {
    // 6 values into 2 buckets: [1,2,3] avg=2, [4,5,6] avg=5
    const result = sampleToWidth([1, 2, 3, 4, 5, 6], 2);
    expect(result).toHaveLength(2);
    expect(result[0]).toBeCloseTo(2, 1);
    expect(result[1]).toBeCloseTo(5, 1);
  });

  it('stretches via nearest-neighbor when upsampling', () => {
    const result = sampleToWidth([0, 10], 4);
    expect(result).toHaveLength(4);
    // First half should be near 0, second half near 10
    expect(result[0]).toBe(0);
    expect(result[3]).toBe(10);
  });

  it('single bucket averages the entire array', () => {
    const result = sampleToWidth([2, 4, 6], 1);
    expect(result).toEqual([4]);
  });
});
