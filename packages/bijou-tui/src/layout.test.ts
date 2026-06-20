import { describe, it, expect } from 'vitest';
import { vstack, hstack } from './layout.js';

describe('vstack', () => {
  it('joins blocks with newlines', () => {
    expect(vstack('hello', 'world')).toBe('hello\nworld');
  });

  it('preserves empty strings as vertical spacers', () => {
    expect(vstack('hello', '', 'world')).toBe('hello\n\nworld');
  });

  it('returns empty string for no args', () => {
    expect(vstack()).toBe('');
  });

  it('returns single block as-is', () => {
    expect(vstack('hello')).toBe('hello');
  });

  it('preserves internal newlines', () => {
    expect(vstack('a\nb', 'c')).toBe('a\nb\nc');
  });
});

describe('hstack', () => {
  it('places blocks side by side', () => {
    expect(hstack(2, 'ab', 'cd')).toBe('ab  cd');
  });

  it('pads shorter blocks with empty lines', () => {
    const result = hstack(1, 'a\nb', 'c');
    expect(result).toBe('a c\nb');
  });

  it('handles multi-line blocks of different heights', () => {
    const result = hstack(1, 'a', 'b\nc\nd');
    expect(result).toBe('a b\n  c\n  d');
  });

  it('pads columns to widest line', () => {
    const result = hstack(1, 'ab\nc', 'x');
    expect(result).toBe('ab x\nc');
  });

  it('returns empty string for no args', () => {
    expect(hstack(2)).toBe('');
  });

  it('returns single block as-is', () => {
    expect(hstack(2, 'hello')).toBe('hello');
  });

  it('handles zero gap', () => {
    expect(hstack(0, 'ab', 'cd')).toBe('abcd');
  });

  it('handles ANSI-styled text for width calculation', () => {
    const styled = '\x1b[31mhi\x1b[0m'; // "hi" in red (visual width 2)
    const result = hstack(1, styled, 'x');
    expect(result).toBe(`${styled} x`);
  });
});
