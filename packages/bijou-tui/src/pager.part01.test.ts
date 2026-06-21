import { describe, it, expect } from 'vitest';
import { createPagerState } from './pager.js';

// ── Test Data ──────────────────────────────────────────────────────

const SHORT_CONTENT = 'line 1\nline 2\nline 3';

const LONG_CONTENT = Array.from({ length: 50 }, (_, i) => `line ${String(i + 1)}`).join('\n');

// ── createPagerState ──────────────────────────────────────────────

describe('createPagerState', () => {
  it('creates state with scroll at 0', () => {
    const state = createPagerState({ content: LONG_CONTENT, width: 40, height: 10 });
    expect(state.scroll.y).toBe(0);
    expect(state.width).toBe(40);
    expect(state.height).toBe(10);
  });

  it('reserves 1 line for status (viewport height = height - 1)', () => {
    const state = createPagerState({ content: LONG_CONTENT, width: 40, height: 10 });
    // 50 lines of content, viewport of 9 lines → maxY = 50 - 9 = 41
    expect(state.scroll.visibleLines).toBe(9);
    expect(state.scroll.maxY).toBe(41);
  });

  it('handles content shorter than viewport', () => {
    const state = createPagerState({ content: SHORT_CONTENT, width: 40, height: 10 });
    expect(state.scroll.maxY).toBe(0);
    expect(state.scroll.totalLines).toBe(3);
  });

  it('handles height of 1 (minimum viewport of 1 line)', () => {
    const state = createPagerState({ content: LONG_CONTENT, width: 40, height: 1 });
    expect(state.scroll.visibleLines).toBe(1);
  });
});
