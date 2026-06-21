import { describe, it, expect } from 'vitest';
import { createFocusAreaState } from './focus-area.js';

const SHORT_CONTENT = 'line 1\nline 2\nline 3';

const LONG_CONTENT = Array.from({ length: 50 }, (_, i) => `line ${String(i + 1)}`).join('\n');

const WIDE_CONTENT = Array.from({ length: 10 }, (_, i) => `${'x'.repeat(80)} row ${String(i + 1)}`).join('\n');

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

  it('preserves one extra content column when overlay scrollbars are requested', () => {
    const gutterState = createFocusAreaState({
      content: WIDE_CONTENT,
      width: 40,
      height: 5,
      overflowX: 'scroll',
      scrollbarMode: 'gutter',
    });
    const overlayState = createFocusAreaState({
      content: WIDE_CONTENT,
      width: 40,
      height: 5,
      overflowX: 'scroll',
      scrollbarMode: 'overlay',
    });

    expect(overlayState.scroll.maxX).toBe(gutterState.scroll.maxX - 1);
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
