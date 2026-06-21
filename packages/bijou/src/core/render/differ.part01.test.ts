import { describe, it, expect } from 'vitest';
import { isSameCell } from './differ.js';

describe('isSameCell', () => {
  it('identifies identical cells', () => {
    const a = { char: 'x', fg: '#ff0000', bg: '#000000', modifiers: ['bold'] };
    const b = { char: 'x', fg: '#ff0000', bg: '#000000', modifiers: ['bold'] };
    expect(isSameCell(a, b)).toBe(true);
  });

  it('identifies character differences', () => {
    const a = { char: 'x' };
    const b = { char: 'y' };
    expect(isSameCell(a, b)).toBe(false);
  });

  it('identifies style differences', () => {
    const a = { char: 'x', fg: '#ff0000' };
    const b = { char: 'x', fg: '#00ff00' };
    expect(isSameCell(a, b)).toBe(false);
  });
});
