import { describe, it, expect } from 'vitest';
import { junctionChar } from './dag-edges.js';

describe('junctionChar', () => {
  it('returns │ for vertical (D+U)', () => {
    expect(junctionChar(new Set(['D', 'U']))).toBe('│');
  });

  it('returns ─ for horizontal (L+R)', () => {
    expect(junctionChar(new Set(['L', 'R']))).toBe('─');
  });

  it('returns ┌ for down+right corner', () => {
    expect(junctionChar(new Set(['D', 'R']))).toBe('┌');
  });

  it('returns ┤ for D+L+U junction', () => {
    expect(junctionChar(new Set(['D', 'L', 'U']))).toBe('┤');
  });

  it('returns ├ for D+R+U junction', () => {
    expect(junctionChar(new Set(['D', 'R', 'U']))).toBe('├');
  });

  it('returns ┼ for all four directions', () => {
    expect(junctionChar(new Set(['D', 'L', 'R', 'U']))).toBe('┼');
  });

  it('returns space for empty direction set (no edge traffic)', () => {
    expect(junctionChar(new Set())).toBe(' ');
  });

  it('renders heavy vertical edges', () => {
    expect(junctionChar(new Set(['D', 'U']), 'heavy')).toBe('┃');
  });

  it('renders double horizontal edges', () => {
    expect(junctionChar(new Set(['L', 'R']), 'double')).toBe('═');
  });

  it('renders dashed horizontal edges with hybrid junctions', () => {
    expect(junctionChar(new Set(['L', 'R']), 'dashed')).toBe('╌');
    expect(junctionChar(new Set(['D', 'R']), 'dashed')).toBe('┌');
  });
});
