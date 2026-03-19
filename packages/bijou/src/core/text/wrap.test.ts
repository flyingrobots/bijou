import { describe, expect, it } from 'vitest';
import { clipToWidth } from './clip.js';
import { graphemeWidth } from './grapheme.js';
import { wrapToWidth } from './wrap.js';

describe('wrapToWidth', () => {
  it('hard-wraps long lines instead of truncating them', () => {
    expect(wrapToWidth('abcdefgh', 3)).toEqual(['abc', 'def', 'gh']);
  });

  it('preserves explicit newlines while wrapping each line independently', () => {
    expect(wrapToWidth('abcd\nefghij', 3)).toEqual(['abc', 'd', 'efg', 'hij']);
  });

  it('preserves ANSI styling across wrapped lines', () => {
    const styled = '\x1b[31mabcdef\x1b[0m';
    const wrapped = wrapToWidth(styled, 2);

    expect(wrapped).toHaveLength(3);
    expect(wrapped.every((line) => line.endsWith('\x1b[0m'))).toBe(true);
    expect(wrapped.map((line) => clipToWidth(line, 2))).toEqual(wrapped);
  });

  it('keeps wrapped lines within the requested display width', () => {
    const wrapped = wrapToWidth('hello world', 4);
    expect(wrapped.every((line) => graphemeWidth(line) <= 4)).toBe(true);
  });

  it('returns an empty visual line when width is non-positive', () => {
    expect(wrapToWidth('hello', 0)).toEqual(['']);
  });
});
