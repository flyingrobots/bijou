import { describe, it, expect } from 'vitest';
import { vstack, hstack, place } from './layout.js';
import { visibleLength } from './viewport.js';

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

// ---------------------------------------------------------------------------
// place()
// ---------------------------------------------------------------------------

describe('place', () => {
  it('h-align left (default) pads on the right', () => {
    const result = place('hi', { width: 6, height: 1 });
    expect(result).toBe('hi    ');
  });

  it('h-align center pads on both sides', () => {
    const result = place('hi', { width: 6, height: 1, hAlign: 'center' });
    expect(result).toBe('  hi  ');
  });

  it('h-align right pads on the left', () => {
    const result = place('hi', { width: 6, height: 1, hAlign: 'right' });
    expect(result).toBe('    hi');
  });

  it('v-align top (default) pads on the bottom', () => {
    const result = place('hi', { width: 2, height: 3 });
    const lines = result.split('\n');
    expect(lines).toEqual(['hi', '  ', '  ']);
  });

  it('v-align middle pads top and bottom', () => {
    const result = place('hi', { width: 2, height: 3, vAlign: 'middle' });
    const lines = result.split('\n');
    expect(lines).toEqual(['  ', 'hi', '  ']);
  });

  it('v-align bottom pads on the top', () => {
    const result = place('hi', { width: 2, height: 3, vAlign: 'bottom' });
    const lines = result.split('\n');
    expect(lines).toEqual(['  ', '  ', 'hi']);
  });

  it('clips content wider than width', () => {
    const result = place('hello world', { width: 5, height: 1 });
    expect(visibleLength(result)).toBe(5);
  });

  it('truncates content taller than height', () => {
    const result = place('a\nb\nc\nd', { width: 1, height: 2 });
    const lines = result.split('\n');
    expect(lines).toEqual(['a', 'b']);
  });

  it('preserves ANSI styles during alignment', () => {
    const styled = '\x1b[31mhi\x1b[0m';
    const result = place(styled, { width: 6, height: 1, hAlign: 'right' });
    // Should have 4 spaces then styled "hi"
    expect(result).toBe('    ' + styled);
    // Visible length should be exactly width
    expect(visibleLength(result)).toBe(6);
  });

  it('empty content produces all blank lines', () => {
    const result = place('', { width: 4, height: 2 });
    const lines = result.split('\n');
    expect(lines).toEqual(['    ', '    ']);
  });

  it('zero width returns empty string', () => {
    expect(place('hi', { width: 0, height: 3 })).toBe('');
  });

  it('zero height returns empty string', () => {
    expect(place('hi', { width: 5, height: 0 })).toBe('');
  });

  it('single line content with height > 1', () => {
    const result = place('ok', { width: 4, height: 2, hAlign: 'center', vAlign: 'middle' });
    const lines = result.split('\n');
    expect(lines).toEqual([' ok ', '    ']);
  });

  it('multi-line content with mixed widths', () => {
    const result = place('ab\nc\ndef', { width: 4, height: 3, hAlign: 'right' });
    const lines = result.split('\n');
    expect(lines).toEqual(['  ab', '   c', ' def']);
  });

  it('clips ANSI-styled content wider than width', () => {
    const styled = '\x1b[32mhello world\x1b[0m';
    const result = place(styled, { width: 5, height: 1 });
    expect(visibleLength(result)).toBe(5);
  });

  it('exact fit does not add padding', () => {
    const result = place('abc\ndef', { width: 3, height: 2 });
    expect(result).toBe('abc\ndef');
  });
});
