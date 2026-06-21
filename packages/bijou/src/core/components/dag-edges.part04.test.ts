import { describe, it, expect } from 'vitest';
import { createGrid } from './dag-edges.js';

describe('createGrid', () => {
  it('creates grid with correct dimensions', () => {
    const g = createGrid(3, 5);
    expect(g.rows).toBe(3);
    expect(g.cols).toBe(5);
    expect(g.dirs.length).toBe(3);
    expect(g.dirs[0]?.length).toBe(5);
  });

  it('cells start with empty direction sets', () => {
    const g = createGrid(2, 2);
    expect(g.dirs[0]?.[0]?.size).toBe(0);
    expect(g.dirs[1]?.[1]?.size).toBe(0);
  });

  it('arrows set starts empty', () => {
    const g = createGrid(2, 2);
    expect(g.arrows.size).toBe(0);
  });
});
