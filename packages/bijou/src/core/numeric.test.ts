import { describe, expect, it } from 'vitest';
import { sanitizeNonNegativeInt, sanitizePositiveInt } from './numeric.js';

describe('numeric sanitizers', () => {
  it('normalizes non-negative integers with finite fallback semantics', () => {
    expect(sanitizeNonNegativeInt(12.9, 0)).toBe(12);
    expect(sanitizeNonNegativeInt(-5, 0)).toBe(0);
    expect(sanitizeNonNegativeInt(Number.NaN, 7.9)).toBe(7);
    expect(sanitizeNonNegativeInt(Number.POSITIVE_INFINITY, 3)).toBe(3);
  });

  it('normalizes positive integers with finite fallback semantics', () => {
    expect(sanitizePositiveInt(4.8, 1)).toBe(4);
    expect(sanitizePositiveInt(0, 5)).toBe(1);
    expect(sanitizePositiveInt(-3, 5)).toBe(1);
    expect(sanitizePositiveInt(Number.NaN, 5.9)).toBe(5);
    expect(sanitizePositiveInt(Number.POSITIVE_INFINITY, 6)).toBe(6);
  });
});
