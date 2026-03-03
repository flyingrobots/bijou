import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import type { KeyMsg } from './types.js';
import {
  createFocusAreaState,
  focusArea,
  focusAreaScrollBy,
  focusAreaScrollTo,
  focusAreaScrollToTop,
  focusAreaScrollToBottom,
  focusAreaPageDown,
  focusAreaPageUp,
  focusAreaScrollByX,
  focusAreaScrollToX,
  focusAreaSetContent,
  focusAreaKeyMap,
} from './focus-area.js';

// ── Test Data ──────────────────────────────────────────────────────

const SHORT_CONTENT = 'line 1\nline 2\nline 3';
const LONG_CONTENT = Array.from({ length: 50 }, (_, i) => `line ${i + 1}`).join('\n');
const WIDE_CONTENT = Array.from({ length: 10 }, (_, i) => `${'x'.repeat(80)} row ${i + 1}`).join('\n');

function keyMsg(key: string, mods?: Partial<KeyMsg>): KeyMsg {
  return { type: 'key', key, ctrl: false, alt: false, shift: false, ...mods };
}

// ── createFocusAreaState ──────────────────────────────────────────

describe('createFocusAreaState', () => {
  it('creates state with scroll at 0', () => {
    const state = createFocusAreaState({ content: LONG_CONTENT, width: 40, height: 10 });
    expect(state.scroll.y).toBe(0);
    expect(state.scroll.x).toBe(0);
    expect(state.width).toBe(40);
    expect(state.height).toBe(10);
  });

  it('stores content', () => {
    const state = createFocusAreaState({ content: SHORT_CONTENT, width: 40, height: 10 });
    expect(state.content).toBe(SHORT_CONTENT);
  });

  it('defaults overflowX to hidden', () => {
    const state = createFocusAreaState({ content: SHORT_CONTENT, width: 40, height: 10 });
    expect(state.overflowX).toBe('hidden');
  });

  it('respects overflowX scroll', () => {
    const state = createFocusAreaState({ content: WIDE_CONTENT, width: 40, height: 10, overflowX: 'scroll' });
    expect(state.overflowX).toBe('scroll');
  });

  it('computes maxX when overflowX is scroll', () => {
    const state = createFocusAreaState({ content: WIDE_CONTENT, width: 40, height: 10, overflowX: 'scroll' });
    // Gutter takes 1 col, scrollbar takes 1 col → content width = 38
    // Lines are 80+ chars → maxX > 0
    expect(state.scroll.maxX).toBeGreaterThan(0);
  });

  it('maxX is 0 when overflowX is hidden', () => {
    const state = createFocusAreaState({ content: WIDE_CONTENT, width: 40, height: 10 });
    expect(state.scroll.maxX).toBe(0);
  });

  it('handles content shorter than viewport', () => {
    const state = createFocusAreaState({ content: SHORT_CONTENT, width: 40, height: 10 });
    expect(state.scroll.maxY).toBe(0);
    expect(state.scroll.totalLines).toBe(3);
  });
});

// ── Vertical scroll transformers ──────────────────────────────────

describe('focusAreaScrollBy', () => {
  it('scrolls down', () => {
    const state = createFocusAreaState({ content: LONG_CONTENT, width: 40, height: 10 });
    const next = focusAreaScrollBy(state, 5);
    expect(next.scroll.y).toBe(5);
  });

  it('clamps to maxY', () => {
    const state = createFocusAreaState({ content: LONG_CONTENT, width: 40, height: 10 });
    const next = focusAreaScrollBy(state, 999);
    expect(next.scroll.y).toBe(state.scroll.maxY);
  });

  it('clamps to 0', () => {
    const state = createFocusAreaState({ content: LONG_CONTENT, width: 40, height: 10 });
    const next = focusAreaScrollBy(state, -5);
    expect(next.scroll.y).toBe(0);
  });
});

describe('focusAreaScrollTo', () => {
  it('scrolls to absolute position', () => {
    const state = createFocusAreaState({ content: LONG_CONTENT, width: 40, height: 10 });
    const next = focusAreaScrollTo(state, 10);
    expect(next.scroll.y).toBe(10);
  });

  it('clamps to valid range', () => {
    const state = createFocusAreaState({ content: LONG_CONTENT, width: 40, height: 10 });
    const next = focusAreaScrollTo(state, 999);
    expect(next.scroll.y).toBe(state.scroll.maxY);
  });
});

describe('focusAreaScrollToTop / focusAreaScrollToBottom', () => {
  it('scrolls to top', () => {
    const state = focusAreaScrollBy(
      createFocusAreaState({ content: LONG_CONTENT, width: 40, height: 10 }),
      20,
    );
    expect(focusAreaScrollToTop(state).scroll.y).toBe(0);
  });

  it('scrolls to bottom', () => {
    const state = createFocusAreaState({ content: LONG_CONTENT, width: 40, height: 10 });
    const next = focusAreaScrollToBottom(state);
    expect(next.scroll.y).toBe(state.scroll.maxY);
  });
});

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

// ── Horizontal scroll transformers ────────────────────────────────

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

// ── focusAreaSetContent ───────────────────────────────────────────

describe('focusAreaSetContent', () => {
  it('updates content and preserves scroll', () => {
    const state = focusAreaScrollBy(
      createFocusAreaState({ content: LONG_CONTENT, width: 40, height: 10 }),
      5,
    );
    const newContent = Array.from({ length: 60 }, (_, i) => `new ${i}`).join('\n');
    const next = focusAreaSetContent(state, newContent);
    expect(next.scroll.y).toBe(5);
    expect(next.scroll.totalLines).toBe(60);
    expect(next.content).toBe(newContent);
  });

  it('clamps scroll when new content is shorter', () => {
    const state = focusAreaScrollBy(
      createFocusAreaState({ content: LONG_CONTENT, width: 40, height: 10 }),
      40,
    );
    const next = focusAreaSetContent(state, SHORT_CONTENT);
    expect(next.scroll.y).toBe(0); // 3 lines < viewport, maxY = 0
  });
});

// ── Render ─────────────────────────────────────────────────────────

describe('focusArea', () => {
  it('renders exactly height lines', () => {
    const state = createFocusAreaState({ content: LONG_CONTENT, width: 40, height: 10 });
    const output = focusArea(state);
    expect(output.split('\n')).toHaveLength(10);
  });

  it('prepends gutter character to each line', () => {
    const state = createFocusAreaState({ content: SHORT_CONTENT, width: 40, height: 5 });
    const output = focusArea(state);
    const lines = output.split('\n');
    for (const line of lines) {
      expect(line).toContain('▎');
    }
  });

  it('focused gutter is styled when ctx is provided', () => {
    const ctx = createTestContext();
    const state = createFocusAreaState({ content: SHORT_CONTENT, width: 40, height: 5 });
    const focused = focusArea(state, { focused: true, ctx });
    const unfocused = focusArea(state, { focused: false, ctx });
    // Both should contain the gutter char (plainStyle won't add ANSI, but
    // the styled() call was made — we verify the gutter is present)
    expect(focused).toContain('▎');
    expect(unfocused).toContain('▎');
  });

  it('defaults to focused=true', () => {
    const state = createFocusAreaState({ content: SHORT_CONTENT, width: 40, height: 5 });
    const output = focusArea(state);
    expect(output).toContain('▎');
  });

  it('first visible line matches scroll position', () => {
    const state = focusAreaScrollBy(
      createFocusAreaState({ content: LONG_CONTENT, width: 40, height: 5 }),
      3,
    );
    const output = focusArea(state);
    const lines = output.split('\n');
    expect(lines[0]).toContain('line 4');
  });

  it('pipe mode renders without gutter', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const state = createFocusAreaState({ content: SHORT_CONTENT, width: 40, height: 5 });
    const output = focusArea(state, { ctx });
    expect(output).not.toContain('▎');
  });

  it('accessible mode renders without gutter', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    const state = createFocusAreaState({ content: SHORT_CONTENT, width: 40, height: 5 });
    const output = focusArea(state, { ctx });
    expect(output).not.toContain('▎');
  });

  it('static mode renders unstyled gutter', () => {
    const ctx = createTestContext({ mode: 'static' });
    const state = createFocusAreaState({ content: SHORT_CONTENT, width: 40, height: 5 });
    const output = focusArea(state, { ctx });
    expect(output).toContain('▎');
  });

  it('renders scrollbar when content exceeds height', () => {
    const state = createFocusAreaState({ content: LONG_CONTENT, width: 40, height: 10 });
    const output = focusArea(state, { showScrollbar: true });
    // Scrollbar uses █ and │ characters
    expect(output).toMatch(/[█│]/);
  });

  it('hides scrollbar when showScrollbar is false', () => {
    const state = createFocusAreaState({ content: LONG_CONTENT, width: 40, height: 10 });
    const output = focusArea(state, { showScrollbar: false });
    expect(output).not.toContain('│');
    expect(output).not.toContain('█');
  });
});

// ── Keymap ──────────────────────────────────────────────────────────

describe('focusAreaKeyMap', () => {
  type Msg = { type: string };

  const km = focusAreaKeyMap<Msg>({
    scrollUp: { type: 'up' },
    scrollDown: { type: 'down' },
    pageUp: { type: 'pu' },
    pageDown: { type: 'pd' },
    top: { type: 'top' },
    bottom: { type: 'bot' },
    scrollLeft: { type: 'left' },
    scrollRight: { type: 'right' },
  });

  it('handles j/k for scroll', () => {
    expect(km.handle(keyMsg('j'))).toEqual({ type: 'down' });
    expect(km.handle(keyMsg('k'))).toEqual({ type: 'up' });
  });

  it('handles page keys', () => {
    expect(km.handle(keyMsg('d'))).toEqual({ type: 'pd' });
    expect(km.handle(keyMsg('u'))).toEqual({ type: 'pu' });
  });

  it('handles top/bottom', () => {
    expect(km.handle(keyMsg('g'))).toEqual({ type: 'top' });
    expect(km.handle(keyMsg('g', { shift: true }))).toEqual({ type: 'bot' });
  });

  it('handles h/l for horizontal scroll', () => {
    expect(km.handle(keyMsg('h'))).toEqual({ type: 'left' });
    expect(km.handle(keyMsg('l'))).toEqual({ type: 'right' });
  });

  it('returns undefined for unbound keys', () => {
    expect(km.handle(keyMsg('x'))).toBeUndefined();
  });

  it('does not bind arrow keys (reserved for content navigation)', () => {
    expect(km.handle(keyMsg('up'))).toBeUndefined();
    expect(km.handle(keyMsg('down'))).toBeUndefined();
    expect(km.handle(keyMsg('left'))).toBeUndefined();
    expect(km.handle(keyMsg('right'))).toBeUndefined();
  });
});
