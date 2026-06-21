import { describe, it, expect } from 'vitest';
import { createFocusAreaState, focusAreaScrollBy } from './focus-area.js';

const LONG_CONTENT = Array.from({ length: 50 }, (_, i) => `line ${String(i + 1)}`).join('\n');

describe('focusAreaScrollBy', () => {
  it('scrolls down', () => {
    const state = createFocusAreaState({ content: LONG_CONTENT, width: 40, height: 10 });
    const next = focusAreaScrollBy(state, 5);
    expect(next.scroll.y).toBe(5);
  });

  it('clamps to maxY', () => {
    const state = createFocusAreaState({ content: LONG_CONTENT, width: 40, height: 10 });
    const next = focusAreaScrollBy(state, 999);
    expect(next.scroll.y).toBe(state.scroll.maxY);
  });

  it('clamps to 0', () => {
    const state = createFocusAreaState({ content: LONG_CONTENT, width: 40, height: 10 });
    const next = focusAreaScrollBy(state, -5);
    expect(next.scroll.y).toBe(0);
  });
});
