import { describe, it, expect } from 'vitest';
import { createScrollState, scrollTo } from './viewport.js';

describe('scrollTo', () => {
  it('scrolls to an absolute position', () => {
    const state = createScrollState('a\nb\nc\nd\ne\nf', 3);
    const next = scrollTo(state, 2);
    expect(next.y).toBe(2);
  });
  it('clamps to valid range', () => {
    const state = createScrollState('a\nb\nc\nd\ne\nf', 3);
    expect(scrollTo(state, -1).y).toBe(0);
    expect(scrollTo(state, 999).y).toBe(3);
  });
});
