import { describe, it, expect } from 'vitest';
import { sliceAnsi, stripAnsi } from './viewport.js';

// ---------------------------------------------------------------------------
// sliceAnsi
// ---------------------------------------------------------------------------
describe('sliceAnsi', () => {
  it('slices plain text', () => {
    expect(sliceAnsi('hello world', 3, 8)).toBe('lo wo');
  });
  it('returns empty for empty string', () => {
    expect(sliceAnsi('', 0, 5)).toBe('');
  });
  it('returns empty when startCol beyond length', () => {
    expect(sliceAnsi('short', 10, 20)).toBe('');
  });
  it('preserves ANSI style crossing startCol', () => {
    const styled = '\x1b[31mhello world\x1b[0m';
    const result = sliceAnsi(styled, 3, 8);
    // Should include the red style prefix
    expect(result).toContain('\x1b[31m');
    const visible = stripAnsi(result);
    expect(visible).toBe('lo wo');
  });
  it('appends reset when clipped at endCol mid-style', () => {
    const styled = '\x1b[31mhello world\x1b[0m';
    const result = sliceAnsi(styled, 0, 5);
    expect(result).toContain('\x1b[0m');
    const visible = stripAnsi(result);
    expect(visible).toBe('hello');
  });
  it('startCol=0 equivalence to clipToWidth for plain text', () => {
    const text = 'abcdefghij';
    const sliced = sliceAnsi(text, 0, 5);
    expect(sliced).toBe('abcde');
  });
});
