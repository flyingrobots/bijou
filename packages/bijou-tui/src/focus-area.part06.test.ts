import { describe, it, expect } from 'vitest';
import { createFocusAreaState, focusAreaScrollBy, focusAreaPageDown, focusAreaPageUp } from './focus-area.js';

const LONG_CONTENT = Array.from({ length: 50 }, (_, i) => `line ${String(i + 1)}`).join('\n');

describe('focusAreaPageDown / focusAreaPageUp', () => {
  it('pages down by viewport height', () => {
    const state = createFocusAreaState({ content: LONG_CONTENT, width: 40, height: 10 });
    const next = focusAreaPageDown(state);
    expect(next.scroll.y).toBe(10); // visibleLines = height = 10
  });

  it('pages up by viewport height', () => {
    const state = focusAreaScrollBy(
      createFocusAreaState({ content: LONG_CONTENT, width: 40, height: 10 }),
      20,
    );
    const next = focusAreaPageUp(state);
    expect(next.scroll.y).toBe(10); // 20 - 10
  });
});
