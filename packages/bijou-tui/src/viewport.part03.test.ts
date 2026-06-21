import { describe, it, expect } from 'vitest';
import { createScrollState } from './viewport.js';

// ---------------------------------------------------------------------------
// Scroll state management
// ---------------------------------------------------------------------------
describe('createScrollState', () => {
  it('initializes at y=0 with correct bounds', () => {
    const content = 'a\nb\nc\nd\ne\nf\ng\nh\ni\nj';
    const state = createScrollState(content, 5);
    expect(state.y).toBe(0);
    expect(state.maxY).toBe(5); // 10 lines - 5 visible
    expect(state.totalLines).toBe(10);
    expect(state.visibleLines).toBe(5);
  });
  it('sets maxY to 0 when content fits', () => {
    const state = createScrollState('a\nb', 5);
    expect(state.maxY).toBe(0);
  });
});
