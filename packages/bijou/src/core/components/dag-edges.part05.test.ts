import { describe, it, expect } from 'vitest';
import { encodeArrowPos, createGrid, markEdge } from './dag-edges.js';

describe('markEdge', () => {
  it('marks straight vertical edge with correct directions', () => {
    const RS = 6;
    const g = createGrid(2 * RS, 20);
    const colCenter = (_layer: number, c: number) => c * 10 + 5;
    markEdge(g, 0, 0, 0, 1, RS, colCenter, 8, 3);
    // sRow = 0*6+3 = 3, dRow = 1*6-1 = 5
    // Vertical from row 3 through row 5, arrow at row 5
    expect(g.dirs[3]?.[5]?.has('D')).toBe(true);
    expect(g.dirs[4]?.[5]?.has('D')).toBe(true);
    expect(g.dirs[4]?.[5]?.has('U')).toBe(true);
    expect(g.arrows.get(encodeArrowPos(5, 5))).toBe(1);
  });

  it('marks elbow edge with horizontal segment', () => {
    const RS = 6;
    const g = createGrid(2 * RS, 30);
    const colCenter = (_layer: number, c: number) => c * 15 + 7;
    markEdge(g, 0, 0, 1, 1, RS, colCenter, 11, 3);
    // mid = sRow+1 = 4, horizontal from col 7 to col 22
    // Check horizontal segment has L and R
    const midRow = 4;
    expect(g.dirs[midRow]?.[10]?.has('L')).toBe(true);
    expect(g.dirs[midRow]?.[10]?.has('R')).toBe(true);
  });

  it('detours same-column skip edges around intermediate node columns', () => {
    const RS = 6;
    const g = createGrid(3 * RS, 40);
    const colCenter = (_layer: number, c: number) => c * 20 + 8;
    markEdge(g, 0, 0, 0, 2, RS, colCenter, 16, 3);

    // The middle layer's center column should remain untouched so the edge
    // does not disappear under the intermediate node box.
    expect(g.dirs[6]?.[8]?.size).toBe(0);
    expect(g.dirs[7]?.[8]?.size).toBe(0);
    expect(g.dirs[8]?.[8]?.size).toBe(0);

    // The detour path runs in the right gap.
    expect(g.dirs[7]?.[17]?.has('D')).toBe(true);
    expect(g.dirs[7]?.[17]?.has('U')).toBe(true);
  });
});
