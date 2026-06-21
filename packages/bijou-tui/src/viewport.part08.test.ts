import { describe, it, expect } from 'vitest';
import { createScrollState, scrollTo, pageDown, pageUp } from './viewport.js';

describe('pageDown / pageUp', () => {
  it('pageDown scrolls by viewport height', () => {
    const state = createScrollState('a\nb\nc\nd\ne\nf\ng\nh\ni\nj', 3);
    const next = pageDown(state);
    expect(next.y).toBe(3);
  });
  it('pageUp scrolls up by viewport height', () => {
    let state = createScrollState('a\nb\nc\nd\ne\nf\ng\nh\ni\nj', 3);
    state = scrollTo(state, 5);
    state = pageUp(state);
    expect(state.y).toBe(2);
  });
  it('pageDown clamps at bottom', () => {
    const state = createScrollState('a\nb\nc', 3);
    const next = pageDown(state);
    expect(next.y).toBe(0); // content fits, maxY = 0
  });
});
