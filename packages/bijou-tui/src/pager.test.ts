import { describe, it, expect } from 'vitest';
import {
  createPagerState,
  pager,
  pagerScrollBy,
  pagerScrollTo,
  pagerScrollToTop,
  pagerScrollToBottom,
  pagerPageDown,
  pagerPageUp,
  pagerSetContent,
  pagerKeyMap,
} from './pager.js';
import type { KeyMsg } from './types.js';

// ── Test Data ──────────────────────────────────────────────────────

const SHORT_CONTENT = 'line 1\nline 2\nline 3';
const LONG_CONTENT = Array.from({ length: 50 }, (_, i) => `line ${i + 1}`).join('\n');

function keyMsg(key: string, mods?: Partial<KeyMsg>): KeyMsg {
  return { type: 'key', key, ctrl: false, alt: false, shift: false, ...mods };
}

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

describe('pagerScrollTo', () => {
  it('scrolls to absolute position', () => {
    const state = createPagerState({ content: LONG_CONTENT, width: 40, height: 10 });
    const next = pagerScrollTo(state, 10);
    expect(next.scroll.y).toBe(10);
  });
});

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

describe('pagerSetContent', () => {
  it('updates content and preserves scroll position', () => {
    const state = pagerScrollBy(
      createPagerState({ content: LONG_CONTENT, width: 40, height: 10 }),
      5,
    );
    const newContent = Array.from({ length: 60 }, (_, i) => `new ${i}`).join('\n');
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

// ── Render ─────────────────────────────────────────────────────────

describe('pager', () => {
  it('renders viewport with status line', () => {
    const state = createPagerState({ content: LONG_CONTENT, width: 20, height: 5 });
    const output = pager(state);
    const lines = output.split('\n');
    // 4 viewport lines + 1 status line = 5
    expect(lines).toHaveLength(5);
    expect(lines[4]).toContain('Line 1/50');
  });

  it('status line updates with scroll position', () => {
    const state = pagerScrollBy(
      createPagerState({ content: LONG_CONTENT, width: 20, height: 5 }),
      10,
    );
    const output = pager(state);
    const lines = output.split('\n');
    expect(lines[4]).toContain('Line 11/50');
  });

  it('renders without status line when showStatus is false', () => {
    const state = createPagerState({ content: LONG_CONTENT, width: 20, height: 5 });
    const output = pager(state, { showStatus: false });
    const lines = output.split('\n');
    // Full viewport height, no status
    expect(lines).toHaveLength(5);
    expect(output).not.toContain('Line');
  });

  it('first visible line matches scroll position', () => {
    const state = pagerScrollBy(
      createPagerState({ content: LONG_CONTENT, width: 20, height: 5 }),
      3,
    );
    const output = pager(state);
    const lines = output.split('\n');
    expect(lines[0]).toContain('line 4');
  });
});

// ── Keymap ──────────────────────────────────────────────────────────

describe('pagerKeyMap', () => {
  type Msg = { type: string };

  const km = pagerKeyMap<Msg>({
    scrollUp: { type: 'up' },
    scrollDown: { type: 'down' },
    pageUp: { type: 'pu' },
    pageDown: { type: 'pd' },
    top: { type: 'top' },
    bottom: { type: 'bot' },
    quit: { type: 'quit' },
  });

  it('handles j/k for scroll', () => {
    expect(km.handle(keyMsg('j'))).toEqual({ type: 'down' });
    expect(km.handle(keyMsg('k'))).toEqual({ type: 'up' });
  });

  it('handles arrow keys', () => {
    expect(km.handle(keyMsg('down'))).toEqual({ type: 'down' });
    expect(km.handle(keyMsg('up'))).toEqual({ type: 'up' });
  });

  it('handles page keys', () => {
    expect(km.handle(keyMsg('d'))).toEqual({ type: 'pd' });
    expect(km.handle(keyMsg('u'))).toEqual({ type: 'pu' });
  });

  it('handles top/bottom', () => {
    expect(km.handle(keyMsg('g'))).toEqual({ type: 'top' });
    expect(km.handle(keyMsg('g', { shift: true }))).toEqual({ type: 'bot' });
  });

  it('handles quit', () => {
    expect(km.handle(keyMsg('q'))).toEqual({ type: 'quit' });
    expect(km.handle(keyMsg('c', { ctrl: true }))).toEqual({ type: 'quit' });
  });

  it('returns undefined for unbound keys', () => {
    expect(km.handle(keyMsg('x'))).toBeUndefined();
  });
});
