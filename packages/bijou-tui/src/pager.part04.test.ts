import { describe, it, expect } from 'vitest';
import { createPagerState, pagerScrollTo } from './pager.js';

const LONG_CONTENT = Array.from({ length: 50 }, (_, i) => `line ${String(i + 1)}`).join('\n');

describe('pagerScrollTo', () => {
  it('scrolls to absolute position', () => {
    const state = createPagerState({ content: LONG_CONTENT, width: 40, height: 10 });
    const next = pagerScrollTo(state, 10);
    expect(next.scroll.y).toBe(10);
  });
});
