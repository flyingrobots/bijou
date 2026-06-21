import { describe, it, expect } from 'vitest';
import { createPagerState, pagerScrollBy, pagerScrollToTop, pagerScrollToBottom } from './pager.js';

const LONG_CONTENT = Array.from({ length: 50 }, (_, i) => `line ${String(i + 1)}`).join('\n');

describe('pagerScrollToTop / pagerScrollToBottom', () => {
  it('scrolls to top', () => {
    const state = pagerScrollBy(
      createPagerState({ content: LONG_CONTENT, width: 40, height: 10 }),
      20,
    );
    expect(pagerScrollToTop(state).scroll.y).toBe(0);
  });

  it('scrolls to bottom', () => {
    const state = createPagerState({ content: LONG_CONTENT, width: 40, height: 10 });
    const next = pagerScrollToBottom(state);
    expect(next.scroll.y).toBe(state.scroll.maxY);
  });
});
