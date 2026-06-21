import { describe, it, expect } from 'vitest';
import { createPagerState, pagerScrollBy } from './pager.js';

const LONG_CONTENT = Array.from({ length: 50 }, (_, i) => `line ${String(i + 1)}`).join('\n');

// ── State transformers ────────────────────────────────────────────

describe('pagerScrollBy', () => {
  it('scrolls down', () => {
    const state = createPagerState({ content: LONG_CONTENT, width: 40, height: 10 });
    const next = pagerScrollBy(state, 5);
    expect(next.scroll.y).toBe(5);
  });

  it('clamps to maxY', () => {
    const state = createPagerState({ content: LONG_CONTENT, width: 40, height: 10 });
    const next = pagerScrollBy(state, 999);
    expect(next.scroll.y).toBe(state.scroll.maxY);
  });

  it('clamps to 0', () => {
    const state = createPagerState({ content: LONG_CONTENT, width: 40, height: 10 });
    const next = pagerScrollBy(state, -5);
    expect(next.scroll.y).toBe(0);
  });
});
