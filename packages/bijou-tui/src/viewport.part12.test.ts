import { describe, it, expect } from 'vitest';
import { createScrollState, visibleLength } from './viewport.js';

// ---------------------------------------------------------------------------
// createScrollState with viewportWidth
// ---------------------------------------------------------------------------
describe('createScrollState with viewportWidth', () => {
  it('computes maxX from widest line', () => {
    const content = 'short\na much longer line here\nmed';
    const state = createScrollState(content, 3, 10);
    expect(state.maxX).toBe(visibleLength('a much longer line here') - 10);
  });
  it('sets maxX=0 when all lines fit', () => {
    const state = createScrollState('hi\nbye', 2, 20);
    expect(state.maxX).toBe(0);
  });
  it('backward compat without viewportWidth', () => {
    const state = createScrollState('hello', 1);
    expect(state.x).toBe(0);
    expect(state.maxX).toBe(0);
  });
});
