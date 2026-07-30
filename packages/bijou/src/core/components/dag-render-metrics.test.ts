import { describe, expect, it } from 'vitest';
import type { DagNode } from './dag.js';
import { minimumDetourWidth } from './dag-render-metrics.js';

describe('minimumDetourWidth', () => {
  it('reserves a side route for same-column skip edges', () => {
    const nodes: DagNode[] = [
      { id: 'a', label: 'A', edges: ['b', 'c'] },
      { id: 'b', label: 'B', edges: ['c'] },
      { id: 'c', label: 'C' },
    ];

    expect(minimumDetourWidth(
      nodes,
      new Map([['a', 0], ['b', 1], ['c', 2]]),
      new Map([['a', 0], ['b', 0], ['c', 0]]),
      [16, 16, 16],
      16,
    )).toBe(34);
  });
});
