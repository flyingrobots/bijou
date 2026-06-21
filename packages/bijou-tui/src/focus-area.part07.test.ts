import { describe, it, expect } from 'vitest';
import { createFocusAreaState, focusAreaScrollByX } from './focus-area.js';

const WIDE_CONTENT = Array.from({ length: 10 }, (_, i) => `${'x'.repeat(80)} row ${String(i + 1)}`).join('\n');

describe('focusAreaScrollByX', () => {
  it('scrolls right when overflowX is scroll', () => {
    const state = createFocusAreaState({ content: WIDE_CONTENT, width: 40, height: 10, overflowX: 'scroll' });
    const next = focusAreaScrollByX(state, 5);
    expect(next.scroll.x).toBe(5);
  });

  it('is a no-op when overflowX is hidden', () => {
    const state = createFocusAreaState({ content: WIDE_CONTENT, width: 40, height: 10 });
    const next = focusAreaScrollByX(state, 5);
    expect(next.scroll.x).toBe(0);
  });

  it('clamps to maxX', () => {
    const state = createFocusAreaState({ content: WIDE_CONTENT, width: 40, height: 10, overflowX: 'scroll' });
    const next = focusAreaScrollByX(state, 9999);
    expect(next.scroll.x).toBe(state.scroll.maxX);
  });
});
