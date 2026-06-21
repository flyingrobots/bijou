import { describe, it, expect } from 'vitest';
import { createFocusAreaState, focusAreaScrollTo } from './focus-area.js';

const LONG_CONTENT = Array.from({ length: 50 }, (_, i) => `line ${String(i + 1)}`).join('\n');

describe('focusAreaScrollTo', () => {
  it('scrolls to absolute position', () => {
    const state = createFocusAreaState({ content: LONG_CONTENT, width: 40, height: 10 });
    const next = focusAreaScrollTo(state, 10);
    expect(next.scroll.y).toBe(10);
  });

  it('clamps to valid range', () => {
    const state = createFocusAreaState({ content: LONG_CONTENT, width: 40, height: 10 });
    const next = focusAreaScrollTo(state, 999);
    expect(next.scroll.y).toBe(state.scroll.maxY);
  });
});
