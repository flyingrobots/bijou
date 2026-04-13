import { describe, it, expect } from 'vitest';
import { buildEdgeRoute, encodeArrowPos, decodeArrowPos, junctionChar, createGrid, markEdge } from './dag-edges.js';

describe('encodeArrowPos / decodeArrowPos', () => {
  it('round-trips a typical position', () => {
    const encoded = encodeArrowPos(42, 137);
    expect(decodeArrowPos(encoded)).toEqual({ row: 42, col: 137 });
  });

  it('round-trips zero', () => {
    const encoded = encodeArrowPos(0, 0);
    expect(decodeArrowPos(encoded)).toEqual({ row: 0, col: 0 });
  });

  it('round-trips max values (65535, 65535)', () => {
    const encoded = encodeArrowPos(65535, 65535);
    expect(decodeArrowPos(encoded)).toEqual({ row: 65535, col: 65535 });
  });

  it('round-trips max row with zero col', () => {
    const encoded = encodeArrowPos(65535, 0);
    expect(decodeArrowPos(encoded)).toEqual({ row: 65535, col: 0 });
  });

  it('round-trips zero row with max col', () => {
    const encoded = encodeArrowPos(0, 65535);
    expect(decodeArrowPos(encoded)).toEqual({ row: 0, col: 65535 });
  });

  it('produces distinct encodings for different positions', () => {
    const a = encodeArrowPos(1, 2);
    const b = encodeArrowPos(2, 1);
    expect(a).not.toBe(b);
  });

  it('produces distinct encodings for (0,1) vs (1,0)', () => {
    expect(encodeArrowPos(0, 1)).not.toBe(encodeArrowPos(1, 0));
  });

  it('produces distinct encodings for (256,0) vs (0,256)', () => {
    expect(encodeArrowPos(256, 0)).not.toBe(encodeArrowPos(0, 256));
  });

  it('silently wraps on overflow (65536,0) same as (0,0)', () => {
    // Documents the 16-bit limit — not a bug, just the documented range
    const overflow = encodeArrowPos(65536, 0);
    const zero = encodeArrowPos(0, 0);
    expect(overflow).toBe(zero);
  });
});

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
});

describe('createGrid', () => {
  it('creates grid with correct dimensions', () => {
    const g = createGrid(3, 5);
    expect(g.rows).toBe(3);
    expect(g.cols).toBe(5);
    expect(g.dirs.length).toBe(3);
    expect(g.dirs[0]!.length).toBe(5);
  });

  it('cells start with empty direction sets', () => {
    const g = createGrid(2, 2);
    expect(g.dirs[0]![0]!.size).toBe(0);
    expect(g.dirs[1]![1]!.size).toBe(0);
  });

  it('arrows set starts empty', () => {
    const g = createGrid(2, 2);
    expect(g.arrows.size).toBe(0);
  });
});

describe('markEdge', () => {
  it('marks straight vertical edge with correct directions', () => {
    const RS = 6;
    const g = createGrid(2 * RS, 20);
    const colCenter = (c: number) => c * 10 + 5;
    markEdge(g, 0, 0, 0, 1, RS, colCenter, 8);
    // sRow = 0*6+3 = 3, dRow = 1*6-1 = 5
    // Vertical from row 3 through row 5, arrow at row 5
    expect(g.dirs[3]![5]!.has('D')).toBe(true);
    expect(g.dirs[4]![5]!.has('D')).toBe(true);
    expect(g.dirs[4]![5]!.has('U')).toBe(true);
    expect(g.arrows.get(encodeArrowPos(5, 5))).toBe(1);
  });

  it('marks elbow edge with horizontal segment', () => {
    const RS = 6;
    const g = createGrid(2 * RS, 30);
    const colCenter = (c: number) => c * 15 + 7;
    markEdge(g, 0, 0, 1, 1, RS, colCenter, 11);
    // mid = sRow+1 = 4, horizontal from col 7 to col 22
    // Check horizontal segment has L and R
    const midRow = 4;
    expect(g.dirs[midRow]![10]!.has('L')).toBe(true);
    expect(g.dirs[midRow]![10]!.has('R')).toBe(true);
  });

  it('detours same-column skip edges around intermediate node columns', () => {
    const RS = 6;
    const g = createGrid(3 * RS, 40);
    const colCenter = (c: number) => c * 20 + 8;
    markEdge(g, 0, 0, 0, 2, RS, colCenter, 16);

    // The middle layer's center column should remain untouched so the edge
    // does not disappear under the intermediate node box.
    expect(g.dirs[6]![8]!.size).toBe(0);
    expect(g.dirs[7]![8]!.size).toBe(0);
    expect(g.dirs[8]![8]!.size).toBe(0);

    // The detour path should run in the gap to the right.
    expect(g.dirs[7]![17]!.has('D')).toBe(true);
    expect(g.dirs[7]![17]!.has('U')).toBe(true);
  });
});

describe('buildEdgeRoute', () => {
  it('keeps same-column skip edges off the intermediate node center', () => {
    const route = buildEdgeRoute(0, 0, 0, 2, 6, (c) => c * 20 + 8, 16, 40);
    expect(route.path.some((point) => point.row === 7 && point.col === 8)).toBe(false);
    expect(route.arrow).toEqual({ row: 11, col: 8 });
  });
});
