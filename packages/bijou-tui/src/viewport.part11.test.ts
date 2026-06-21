import { describe, it, expect } from 'vitest';
import { createScrollState, scrollToX } from './viewport.js';

describe('scrollToX', () => {
  it('scrolls to absolute X', () => {
    const state = createScrollState('1234567890', 1, 5);
    const next = scrollToX(state, 3);
    expect(next.x).toBe(3);
  });
  it('clamps to valid range', () => {
    const state = createScrollState('1234567890', 1, 5);
    expect(scrollToX(state, -1).x).toBe(0);
    expect(scrollToX(state, 999).x).toBe(5);
  });
});
