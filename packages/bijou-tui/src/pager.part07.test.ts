import { describe, it, expect } from 'vitest';
import { createPagerState, pagerScrollBy, pagerSetContent } from './pager.js';

// ── Test Data ──────────────────────────────────────────────────────

const SHORT_CONTENT = 'line 1\nline 2\nline 3';

const LONG_CONTENT = Array.from({ length: 50 }, (_, i) => `line ${String(i + 1)}`).join('\n');

describe('pagerSetContent', () => {
  it('updates content and preserves scroll position', () => {
    const state = pagerScrollBy(
      createPagerState({ content: LONG_CONTENT, width: 40, height: 10 }),
      5,
    );
    const newContent = Array.from({ length: 60 }, (_, i) => `new ${String(i)}`).join('\n');
    const next = pagerSetContent(state, newContent);
    expect(next.scroll.y).toBe(5);
    expect(next.scroll.totalLines).toBe(60);
    expect(next.content).toBe(newContent);
  });

  it('clamps scroll when new content is shorter', () => {
    const state = pagerScrollBy(
      createPagerState({ content: LONG_CONTENT, width: 40, height: 10 }),
      40,
    );
    const next = pagerSetContent(state, SHORT_CONTENT);
    expect(next.scroll.y).toBe(0); // 3 lines < viewport, maxY = 0
  });
});
