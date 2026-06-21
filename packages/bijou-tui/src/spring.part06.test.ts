import { describe, it, expect } from 'vitest';
import { EASINGS } from './spring.js';

// ---------------------------------------------------------------------------
// Easings
// ---------------------------------------------------------------------------

describe('EASINGS', () => {
  it('linear returns t unchanged', () => {
    expect(EASINGS.linear(0)).toBe(0);
    expect(EASINGS.linear(0.5)).toBe(0.5);
    expect(EASINGS.linear(1)).toBe(1);
  });

  it.each(Object.entries(EASINGS))('%s maps 0→0 and 1→1', (_name, fn) => {
    expect(fn(0)).toBeCloseTo(0, 5);
    expect(fn(1)).toBeCloseTo(1, 5);
  });

  it('easeIn starts slow', () => {
    expect(EASINGS.easeIn(0.1)).toBeLessThan(0.1);
  });

  it('easeOut starts fast', () => {
    expect(EASINGS.easeOut(0.1)).toBeGreaterThan(0.1);
  });
});
