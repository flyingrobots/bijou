import { describe, it, expect } from 'vitest';
import { createFocusAreaState, focusAreaScrollBy, focusAreaScrollToTop, focusAreaScrollToBottom } from './focus-area.js';

const LONG_CONTENT = Array.from({ length: 50 }, (_, i) => `line ${String(i + 1)}`).join('\n');

describe('focusAreaScrollToTop / focusAreaScrollToBottom', () => {
  it('scrolls to top', () => {
    const state = focusAreaScrollBy(
      createFocusAreaState({ content: LONG_CONTENT, width: 40, height: 10 }),
      20,
    );
    expect(focusAreaScrollToTop(state).scroll.y).toBe(0);
  });

  it('scrolls to bottom', () => {
    const state = createFocusAreaState({ content: LONG_CONTENT, width: 40, height: 10 });
    const next = focusAreaScrollToBottom(state);
    expect(next.scroll.y).toBe(state.scroll.maxY);
  });
});
