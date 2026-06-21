import { describe, it, expect } from 'vitest';
import { createPagerState, pagerScrollBy, pagerPageDown, pagerPageUp } from './pager.js';

const LONG_CONTENT = Array.from({ length: 50 }, (_, i) => `line ${String(i + 1)}`).join('\n');

describe('pagerPageDown / pagerPageUp', () => {
  it('pages down by viewport height', () => {
    const state = createPagerState({ content: LONG_CONTENT, width: 40, height: 10 });
    const next = pagerPageDown(state);
    expect(next.scroll.y).toBe(9); // viewportHeight = 9
  });

  it('pages up by viewport height', () => {
    const state = pagerScrollBy(
      createPagerState({ content: LONG_CONTENT, width: 40, height: 10 }),
      20,
    );
    const next = pagerPageUp(state);
    expect(next.scroll.y).toBe(11); // 20 - 9
  });
});
