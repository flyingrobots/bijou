import { describe, it, expect } from 'vitest';
import { createScrollState, scrollByX } from './viewport.js';

// ---------------------------------------------------------------------------
// scrollByX / scrollToX
// ---------------------------------------------------------------------------
describe('scrollByX', () => {
  it('scrolls right', () => {
    const state = createScrollState('a long line here!!!', 1, 5);
    const next = scrollByX(state, 3);
    expect(next.x).toBe(3);
  });
  it('clamps to maxX', () => {
    const state = createScrollState('1234567890', 1, 5);
    // maxX = 10 - 5 = 5
    const next = scrollByX(state, 999);
    expect(next.x).toBe(5);
  });
  it('clamps to 0', () => {
    const state = createScrollState('1234567890', 1, 5);
    const next = scrollByX(state, -5);
    expect(next.x).toBe(0);
  });
});
