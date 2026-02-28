import { describe, it, expect } from 'vitest';
import { clipToWidth } from './clip.js';

describe('clipToWidth()', () => {
  it('clips string to exact visible width', () => {
    expect(clipToWidth('Hello World', 5)).toBe('Hello');
  });

  it('returns original when it fits', () => {
    expect(clipToWidth('Hi', 10)).toBe('Hi');
  });

  it('returns empty for maxWidth=0', () => {
    expect(clipToWidth('Hello', 0)).toBe('');
  });

  it('preserves ANSI escapes in clipped output', () => {
    const styled = '\x1b[31mHello World\x1b[0m';
    const result = clipToWidth(styled, 5);
    expect(result).toBe('\x1b[31mHello\x1b[0m');
  });

  it('appends reset only when ANSI present', () => {
    // No ANSI — no reset appended
    const plain = clipToWidth('Hello World', 5);
    expect(plain).toBe('Hello');
    expect(plain).not.toContain('\x1b[0m');

    // With ANSI — reset appended when clipped
    const styled = clipToWidth('\x1b[31mHello World\x1b[0m', 5);
    expect(styled).toContain('\x1b[0m');
  });

  it('does not split multi-codepoint emoji', () => {
    // Family emoji (ZWJ sequence) is width 2
    const family = '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}';
    // Width 2 — should fit in maxWidth=2 but not maxWidth=1
    expect(clipToWidth(family, 2)).toBe(family);
    expect(clipToWidth(family, 1)).toBe('');
  });

  it('correctly measures CJK as width 2', () => {
    // Three CJK chars = width 6
    const cjk = '\u4F60\u597D\u4E16'; // 你好世
    expect(clipToWidth(cjk, 4)).toBe('\u4F60\u597D'); // 你好 (width 4)
    expect(clipToWidth(cjk, 5)).toBe('\u4F60\u597D'); // Can't fit 世 (would be 6)
    expect(clipToWidth(cjk, 6)).toBe(cjk);
  });

  it('handles empty string', () => {
    expect(clipToWidth('', 10)).toBe('');
  });

  it('handles string with only ANSI escapes', () => {
    expect(clipToWidth('\x1b[31m\x1b[0m', 10)).toBe('\x1b[31m\x1b[0m');
  });
});
