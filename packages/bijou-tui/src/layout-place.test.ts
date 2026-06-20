import { describe, expect, it } from 'vitest';
import { place } from './layout.js';
import { visibleLength } from './viewport.js';

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
    expect(result.split('\n')).toEqual(['hi', '  ', '  ']);
  });

  it('v-align middle pads top and bottom', () => {
    const result = place('hi', { width: 2, height: 3, vAlign: 'middle' });
    expect(result.split('\n')).toEqual(['  ', 'hi', '  ']);
  });

  it('v-align bottom pads on the top', () => {
    const result = place('hi', { width: 2, height: 3, vAlign: 'bottom' });
    expect(result.split('\n')).toEqual(['  ', '  ', 'hi']);
  });

  it('clips content wider than width', () => {
    const result = place('hello world', { width: 5, height: 1 });
    expect(visibleLength(result)).toBe(5);
  });

  it('truncates content taller than height', () => {
    const result = place('a\nb\nc\nd', { width: 1, height: 2 });
    expect(result.split('\n')).toEqual(['a', 'b']);
  });

  it('preserves ANSI styles during alignment', () => {
    const styled = '\x1b[31mhi\x1b[0m';
    const result = place(styled, { width: 6, height: 1, hAlign: 'right' });
    expect(result).toBe('    ' + styled);
    expect(visibleLength(result)).toBe(6);
  });

  it('empty content produces all blank lines', () => {
    const result = place('', { width: 4, height: 2 });
    expect(result.split('\n')).toEqual(['    ', '    ']);
  });

  it('zero width returns empty string', () => {
    expect(place('hi', { width: 0, height: 3 })).toBe('');
  });

  it('zero height returns empty string', () => {
    expect(place('hi', { width: 5, height: 0 })).toBe('');
  });

  it('single line content with height > 1', () => {
    const result = place('ok', { width: 4, height: 2, hAlign: 'center', vAlign: 'middle' });
    expect(result.split('\n')).toEqual([' ok ', '    ']);
  });

  it('multi-line content with mixed widths', () => {
    const result = place('ab\nc\ndef', { width: 4, height: 3, hAlign: 'right' });
    expect(result.split('\n')).toEqual(['  ab', '   c', ' def']);
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
