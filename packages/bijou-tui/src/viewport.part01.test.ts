import { describe, it, expect } from 'vitest';
import { viewport, stripAnsi } from './viewport.js';
import { must } from '@flyingrobots/bijou/adapters/test';

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
    expect(lines[0]?.trimEnd()).toBe('line 3');
    expect(lines[1]?.trimEnd()).toBe('line 4');
    expect(lines[2]?.trimEnd()).toBe('line 5');
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
    expect(lines[0]?.trimEnd()).toBe('line 3');
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
    expect(lines[0]?.trimEnd()).toBe('line 1');
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
    expect(lines[0]?.trimEnd()).toBe('only one line');
    expect(lines[1]?.trimEnd()).toBe('');
  });
  it('clips long lines to viewport width', () => {
    const wideContent = 'a'.repeat(50);
    const result = viewport({
      width: 10,
      height: 1,
      content: wideContent,
      showScrollbar: false,
    });
    const line = must(result.split('\n')[0]);
    // After stripping ANSI, visible length should be ≤ 10
    expect(stripAnsi(line).length).toBeLessThanOrEqual(10);
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
      const lastChar = stripAnsi(line).trimEnd().slice(-1);
      expect(['█', '│']).toContain(lastChar);
    }
  });
  it('supports overlay scrollbars without reserving an extra gutter column', () => {
    const result = viewport({
      width: 5,
      height: 2,
      content: 'abcde\nfghij\nklmno\npqrst',
      showScrollbar: true,
      scrollbarMode: 'overlay',
    });
    expect(result.split('\n')).toEqual(['abcd█', 'fghi│']);
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
      const stripped = stripAnsi(line).trimEnd();
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
      const stripped = stripAnsi(line).trimEnd();
      expect(stripped).not.toContain('█');
      expect(stripped).not.toContain('│');
    }
  });
});
