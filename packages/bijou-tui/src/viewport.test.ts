import { describe, it, expect } from 'vitest';
import {
  viewport,
  createScrollState,
  scrollBy,
  scrollTo,
  scrollToTop,
  scrollToBottom,
  pageDown,
  pageUp,
} from './viewport.js';

// ---------------------------------------------------------------------------
// viewport()
// ---------------------------------------------------------------------------

describe('viewport', () => {
  const content = ['line 1', 'line 2', 'line 3', 'line 4', 'line 5'].join('\n');

  it('renders visible lines within the viewport height', () => {
    const result = viewport({ width: 10, height: 3, content });
    const lines = result.split('\n');
    expect(lines).toHaveLength(3);
  });

  it('shows lines starting from scrollY', () => {
    const result = viewport({
      width: 10,
      height: 3,
      content,
      scrollY: 2,
      showScrollbar: false,
    });
    const lines = result.split('\n');
    expect(lines[0]!.trimEnd()).toBe('line 3');
    expect(lines[1]!.trimEnd()).toBe('line 4');
    expect(lines[2]!.trimEnd()).toBe('line 5');
  });

  it('clamps scrollY to valid range', () => {
    const result = viewport({
      width: 10,
      height: 3,
      content,
      scrollY: 999,
      showScrollbar: false,
    });
    const lines = result.split('\n');
    // Should clamp to maxScroll = 5 - 3 = 2
    expect(lines[0]!.trimEnd()).toBe('line 3');
  });

  it('clamps negative scrollY to 0', () => {
    const result = viewport({
      width: 10,
      height: 3,
      content,
      scrollY: -5,
      showScrollbar: false,
    });
    const lines = result.split('\n');
    expect(lines[0]!.trimEnd()).toBe('line 1');
  });

  it('pads short content to fill viewport height', () => {
    const shortContent = 'only one line';
    const result = viewport({
      width: 20,
      height: 3,
      content: shortContent,
      showScrollbar: false,
    });
    const lines = result.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]!.trimEnd()).toBe('only one line');
    expect(lines[1]!.trimEnd()).toBe('');
  });

  it('clips long lines to viewport width', () => {
    const wideContent = 'a'.repeat(50);
    const result = viewport({
      width: 10,
      height: 1,
      content: wideContent,
      showScrollbar: false,
    });
    const line = result.split('\n')[0]!;
    // After stripping any ANSI reset, visible length should be ≤ 10
    const visible = line.replace(/\x1b\[[0-9;]*m/g, '');
    expect(visible.length).toBeLessThanOrEqual(10);
  });

  it('shows scrollbar when content exceeds viewport', () => {
    const result = viewport({
      width: 12,
      height: 3,
      content,
      showScrollbar: true,
    });
    const lines = result.split('\n');
    // Each line should include a scrollbar character at the end
    for (const line of lines) {
      const lastChar = line.replace(/\x1b\[[0-9;]*m/g, '').trimEnd().slice(-1);
      expect(['█', '│']).toContain(lastChar);
    }
  });

  it('hides scrollbar when content fits', () => {
    const shortContent = 'a\nb\nc';
    const result = viewport({
      width: 10,
      height: 5,
      content: shortContent,
      showScrollbar: true,
    });
    const lines = result.split('\n');
    // No scrollbar chars — content fits entirely
    for (const line of lines) {
      const stripped = line.replace(/\x1b\[[0-9;]*m/g, '').trimEnd();
      expect(stripped).not.toContain('█');
      expect(stripped).not.toContain('│');
    }
  });

  it('hides scrollbar when showScrollbar is false', () => {
    const result = viewport({
      width: 10,
      height: 3,
      content,
      showScrollbar: false,
    });
    const lines = result.split('\n');
    for (const line of lines) {
      const stripped = line.replace(/\x1b\[[0-9;]*m/g, '').trimEnd();
      expect(stripped).not.toContain('█');
      expect(stripped).not.toContain('│');
    }
  });
});

// ---------------------------------------------------------------------------
// Scroll state management
// ---------------------------------------------------------------------------

describe('createScrollState', () => {
  it('initializes at y=0 with correct bounds', () => {
    const content = 'a\nb\nc\nd\ne\nf\ng\nh\ni\nj';
    const state = createScrollState(content, 5);
    expect(state.y).toBe(0);
    expect(state.maxY).toBe(5); // 10 lines - 5 visible
    expect(state.totalLines).toBe(10);
    expect(state.visibleLines).toBe(5);
  });

  it('sets maxY to 0 when content fits', () => {
    const state = createScrollState('a\nb', 5);
    expect(state.maxY).toBe(0);
  });
});

describe('scrollBy', () => {
  it('scrolls down', () => {
    const state = createScrollState('a\nb\nc\nd\ne\nf', 3);
    const next = scrollBy(state, 2);
    expect(next.y).toBe(2);
  });

  it('clamps to maxY', () => {
    const state = createScrollState('a\nb\nc\nd\ne\nf', 3);
    const next = scrollBy(state, 999);
    expect(next.y).toBe(3); // 6 lines - 3 visible
  });

  it('clamps to 0', () => {
    const state = createScrollState('a\nb\nc\nd\ne\nf', 3);
    const next = scrollBy(state, -5);
    expect(next.y).toBe(0);
  });
});

describe('scrollTo', () => {
  it('scrolls to an absolute position', () => {
    const state = createScrollState('a\nb\nc\nd\ne\nf', 3);
    const next = scrollTo(state, 2);
    expect(next.y).toBe(2);
  });

  it('clamps to valid range', () => {
    const state = createScrollState('a\nb\nc\nd\ne\nf', 3);
    expect(scrollTo(state, -1).y).toBe(0);
    expect(scrollTo(state, 999).y).toBe(3);
  });
});

describe('scrollToTop / scrollToBottom', () => {
  it('scrollToTop goes to 0', () => {
    let state = createScrollState('a\nb\nc\nd\ne\nf', 3);
    state = scrollBy(state, 2);
    state = scrollToTop(state);
    expect(state.y).toBe(0);
  });

  it('scrollToBottom goes to maxY', () => {
    const state = createScrollState('a\nb\nc\nd\ne\nf', 3);
    const next = scrollToBottom(state);
    expect(next.y).toBe(3);
  });
});

describe('pageDown / pageUp', () => {
  it('pageDown scrolls by viewport height', () => {
    const state = createScrollState('a\nb\nc\nd\ne\nf\ng\nh\ni\nj', 3);
    const next = pageDown(state);
    expect(next.y).toBe(3);
  });

  it('pageUp scrolls up by viewport height', () => {
    let state = createScrollState('a\nb\nc\nd\ne\nf\ng\nh\ni\nj', 3);
    state = scrollTo(state, 5);
    state = pageUp(state);
    expect(state.y).toBe(2);
  });

  it('pageDown clamps at bottom', () => {
    const state = createScrollState('a\nb\nc', 3);
    const next = pageDown(state);
    expect(next.y).toBe(0); // content fits, maxY = 0
  });
});
