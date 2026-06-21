import { describe, it, expect } from 'vitest';
import { stringToSurface } from '@flyingrobots/bijou';
import { createPagerStateForSurface } from './pager.js';

describe('createPagerStateForSurface', () => {
  it('computes scroll bounds from surface height', () => {
    const surface = stringToSurface('line1\nline2\nline3\nline4', 5, 4);
    const state = createPagerStateForSurface(surface, { width: 20, height: 3 });

    expect(state.scroll.visibleLines).toBe(2);
    expect(state.scroll.totalLines).toBe(4);
    expect(state.scroll.maxY).toBe(2);
  });
});
