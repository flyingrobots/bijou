import { describe, it, expect } from 'vitest';
import { createScrollState, scrollBy, scrollToTop, scrollToBottom } from './viewport.js';

describe('scrollToTop / scrollToBottom', () => {
  it('scrollToTop goes to 0', () => {
    let state = createScrollState('a\nb\nc\nd\ne\nf', 3);
    state = scrollBy(state, 2);
    state = scrollToTop(state);
    expect(state.y).toBe(0);
  });
  it('scrollToBottom goes to maxY', () => {
    const state = createScrollState('a\nb\nc\nd\ne\nf', 3);
    const next = scrollToBottom(state);
    expect(next.y).toBe(3);
  });
});
