import { describe, it, expect } from 'vitest';
import { dagStats } from './dag-stats.js';
import type { DagNode } from './dag.js';
import { arraySource } from './dag-source.js';

describe('dagStats()', () => {
  it('empty graph returns all zeros', () => {
    expect(dagStats([])).toEqual({
      nodes: 0, edges: 0, depth: 0, width: 0, roots: 0, leaves: 0,
    });
  });

  it('single node', () => {
    const nodes: DagNode[] = [{ id: 'a', label: 'A' }];
    expect(dagStats(nodes)).toEqual({
      nodes: 1, edges: 0, depth: 1, width: 1, roots: 1, leaves: 1,
    });
  });

  it('linear chain A→B→C', () => {
    const nodes: DagNode[] = [
      { id: 'a', label: 'A', edges: ['b'] },
      { id: 'b', label: 'B', edges: ['c'] },
      { id: 'c', label: 'C' },
    ];
    expect(dagStats(nodes)).toEqual({
      nodes: 3, edges: 2, depth: 3, width: 1, roots: 1, leaves: 1,
    });
  });

  it('diamond A→B,C→D', () => {
    const nodes: DagNode[] = [
      { id: 'a', label: 'A', edges: ['b', 'c'] },
      { id: 'b', label: 'B', edges: ['d'] },
      { id: 'c', label: 'C', edges: ['d'] },
      { id: 'd', label: 'D' },
    ];
    expect(dagStats(nodes)).toEqual({
      nodes: 4, edges: 4, depth: 3, width: 2, roots: 1, leaves: 1,
    });
  });

  it('wide fan-out', () => {
    const nodes: DagNode[] = [
      { id: 'root', label: 'Root', edges: ['a', 'b', 'c', 'd', 'e'] },
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
      { id: 'c', label: 'C' },
      { id: 'd', label: 'D' },
      { id: 'e', label: 'E' },
    ];
    expect(dagStats(nodes)).toEqual({
      nodes: 6, edges: 5, depth: 2, width: 5, roots: 1, leaves: 5,
    });
  });

  it('cycle throws', () => {
    const nodes: DagNode[] = [
      { id: 'a', label: 'A', edges: ['b'] },
      { id: 'b', label: 'B', edges: ['a'] },
    ];
    expect(() => dagStats(nodes)).toThrow('cycle detected');
  });

  it('self-loop throws', () => {
    const nodes: DagNode[] = [
      { id: 'a', label: 'A', edges: ['a'] },
    ];
    expect(() => dagStats(nodes)).toThrow('cycle detected');
  });

  it('ghost nodes are filtered out', () => {
    const nodes: DagNode[] = [
      { id: 'a', label: 'A', edges: ['b'] },
      { id: 'b', label: 'B' },
      { id: 'ghost1', label: '... 3 ancestors', _ghost: true, edges: ['a'] },
    ];
    expect(dagStats(nodes)).toEqual({
      nodes: 2, edges: 1, depth: 2, width: 1, roots: 1, leaves: 1,
    });
  });

  it('accepts SlicedDagSource', () => {
    const nodes: DagNode[] = [
      { id: 'a', label: 'A', edges: ['b'] },
      { id: 'b', label: 'B' },
    ];
    const source = arraySource(nodes);
    expect(dagStats(source)).toEqual({
      nodes: 2, edges: 1, depth: 2, width: 1, roots: 1, leaves: 1,
    });
  });

  it('disconnected components', () => {
    const nodes: DagNode[] = [
      { id: 'a', label: 'A', edges: ['b'] },
      { id: 'b', label: 'B' },
      { id: 'c', label: 'C', edges: ['d'] },
      { id: 'd', label: 'D', edges: ['e'] },
      { id: 'e', label: 'E' },
    ];
    expect(dagStats(nodes)).toEqual({
      nodes: 5, edges: 3, depth: 3, width: 2, roots: 2, leaves: 2,
    });
  });

  it('multiple roots and leaves', () => {
    const nodes: DagNode[] = [
      { id: 'a', label: 'A', edges: ['c'] },
      { id: 'b', label: 'B', edges: ['c'] },
      { id: 'c', label: 'C', edges: ['d', 'e'] },
      { id: 'd', label: 'D' },
      { id: 'e', label: 'E' },
    ];
    expect(dagStats(nodes)).toEqual({
      nodes: 5, edges: 4, depth: 3, width: 2, roots: 2, leaves: 2,
    });
  });
});
