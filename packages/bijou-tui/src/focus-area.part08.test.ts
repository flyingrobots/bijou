import { describe, it, expect } from 'vitest';
import { createFocusAreaState, focusAreaScrollToX } from './focus-area.js';

const WIDE_CONTENT = Array.from({ length: 10 }, (_, i) => `${'x'.repeat(80)} row ${String(i + 1)}`).join('\n');

describe('focusAreaScrollToX', () => {
  it('scrolls to absolute X when overflowX is scroll', () => {
    const state = createFocusAreaState({ content: WIDE_CONTENT, width: 40, height: 10, overflowX: 'scroll' });
    const next = focusAreaScrollToX(state, 10);
    expect(next.scroll.x).toBe(10);
  });

  it('is a no-op when overflowX is hidden', () => {
    const state = createFocusAreaState({ content: WIDE_CONTENT, width: 40, height: 10 });
    const next = focusAreaScrollToX(state, 10);
    expect(next.scroll.x).toBe(0);
  });
});
