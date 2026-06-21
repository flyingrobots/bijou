import { describe, it, expect } from 'vitest';
import { createScrollState, scrollBy } from './viewport.js';

describe('scrollBy', () => {
  it('scrolls down', () => {
    const state = createScrollState('a\nb\nc\nd\ne\nf', 3);
    const next = scrollBy(state, 2);
    expect(next.y).toBe(2);
  });
  it('clamps to maxY', () => {
    const state = createScrollState('a\nb\nc\nd\ne\nf', 3);
    const next = scrollBy(state, 999);
    expect(next.y).toBe(3); // 6 lines - 3 visible
  });
  it('clamps to 0', () => {
    const state = createScrollState('a\nb\nc\nd\ne\nf', 3);
    const next = scrollBy(state, -5);
    expect(next.y).toBe(0);
  });
});
