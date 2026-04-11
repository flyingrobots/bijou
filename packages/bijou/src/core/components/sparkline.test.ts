import { describe, it, expect } from 'vitest';
import { sparkline } from './sparkline.js';

describe('sparkline', () => {
  it('returns empty string for empty input', () => {
    expect(sparkline([])).toBe('');
  });

  it('returns a single block char for a single value', () => {
    const result = sparkline([5]);
    expect(result).toHaveLength(1);
    expect(result).toBe('▅'); // single value normalizes to midpoint
  });

  it('renders min as lowest block and max as highest', () => {
    const result = sparkline([0, 100]);
    expect(result[0]).toBe('▁');
    expect(result[1]).toBe('█');
  });

  it('uses all block levels for a linear ramp', () => {
    const result = sparkline([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(result).toHaveLength(8);
    expect(result).toBe('▁▂▃▄▅▆▇█');
  });

  it('respects explicit width by sampling', () => {
    const result = sparkline([0, 50, 100], { width: 6 });
    expect(result).toHaveLength(6);
  });

  it('respects explicit min/max', () => {
    const result = sparkline([50], { min: 0, max: 100 });
    expect(result).toBe('▅');
  });

  it('handles all-same values', () => {
    const result = sparkline([5, 5, 5, 5]);
    expect(result).toHaveLength(4);
    // All same → all midpoint
    for (const ch of result) {
      expect(ch).toBe('▅');
    }
  });

  it('returns empty string for zero width', () => {
    expect(sparkline([1, 2, 3], { width: 0 })).toBe('');
  });

  it('returns empty string for negative width', () => {
    expect(sparkline([1, 2, 3], { width: -5 })).toBe('');
  });

  it('handles negative values', () => {
    const result = sparkline([-10, 0, 10]);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('▁');
    expect(result[2]).toBe('█');
  });

  it('treats NaN values as 0', () => {
    const result = sparkline([0, NaN, 10]);
    expect(result).toHaveLength(3);
    // NaN becomes 0, so [0, 0, 10] → min=0, max=10
    expect(result[0]).toBe('▁');
    expect(result[1]).toBe('▁');
    expect(result[2]).toBe('█');
  });

  it('treats Infinity values as 0', () => {
    const result = sparkline([0, Infinity, 10]);
    expect(result).toHaveLength(3);
    // Infinity becomes 0, so [0, 0, 10]
    expect(result[0]).toBe('▁');
    expect(result[2]).toBe('█');
  });

  it('treats -Infinity values as 0', () => {
    const result = sparkline([0, -Infinity, 10]);
    expect(result).toHaveLength(3);
    expect(result[2]).toBe('█');
  });

  it('handles large arrays without stack overflow', () => {
    const values = new Array(100_000).fill(0).map((_, i) => Math.sin(i * 0.01));
    const result = sparkline(values, { width: 50 });
    expect(result).toHaveLength(50);
    // Every character should be a valid block element
    for (const ch of result) {
      expect('▁▂▃▄▅▆▇█').toContain(ch);
    }
  });
});
