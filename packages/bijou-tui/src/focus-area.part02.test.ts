import { describe, it, expect } from 'vitest';
import { stringToSurface } from '@flyingrobots/bijou';
import { createFocusAreaStateForSurface } from './focus-area.js';

describe('createFocusAreaStateForSurface', () => {
  it('computes scroll bounds from rendered surface dimensions', () => {
    const surface = stringToSurface('abcdef\nghijkl\nmnopqr', 6, 3);
    const state = createFocusAreaStateForSurface(surface, {
      width: 5,
      height: 2,
      overflowX: 'scroll',
    });

    expect(state.scroll.maxY).toBe(1);
    expect(state.scroll.maxX).toBe(3);
    expect(state.scroll.totalLines).toBe(3);
  });
});
