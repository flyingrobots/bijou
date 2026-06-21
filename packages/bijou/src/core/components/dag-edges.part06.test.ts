import { describe, it, expect } from 'vitest';
import { buildEdgeRoute } from './dag-edges.js';

describe('buildEdgeRoute', () => {
  it('keeps same-column skip edges off the intermediate node center', () => {
    const route = buildEdgeRoute(0, 0, 0, 2, 6, (_layer, c) => c * 20 + 8, 16, 3, 40);
    expect(route.path.some((point) => point.row === 7 && point.col === 8)).toBe(false);
    expect(route.arrow).toEqual({ row: 11, col: 8 });
  });
});
