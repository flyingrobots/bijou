import { describe, it, expect } from 'vitest';
import { dag, dagSlice } from './dag.js';
import type { DagNode } from './dag.js';
import { createTestContext } from '../../adapters/test/index.js';

const largeGraph: DagNode[] = [
  { id: 'root', label: 'Root', edges: ['a', 'b'] },
  { id: 'a', label: 'A', edges: ['c', 'd'] },
  { id: 'b', label: 'B', edges: ['d', 'e'] },
  { id: 'c', label: 'C', edges: ['f'] },
  { id: 'd', label: 'D', edges: ['f'] },
  { id: 'e', label: 'E', edges: ['f'] },
  { id: 'f', label: 'F' },
];

// ── Basic Tests ────────────────────────────────────────────────────

describe('dagSlice', () => {
  it('returns empty for unknown focus', () => {
    expect(dagSlice(largeGraph, 'unknown')).toEqual([]);
  });

  it('extracts ancestors', () => {
    const result = dagSlice(largeGraph, 'f', { direction: 'ancestors' });
    const ids = result.map(n => n.id);
    expect(ids).toContain('f');
    expect(ids).toContain('c');
    expect(ids).toContain('d');
    expect(ids).toContain('e');
    expect(ids).toContain('a');
    expect(ids).toContain('b');
    expect(ids).toContain('root');
  });

  it('extracts all descendants', () => {
    const result = dagSlice(largeGraph, 'root', { direction: 'descendants' });
    const ids = result.map(n => n.id);
    expect(ids).toContain('root');
    expect(ids).toContain('a');
    expect(ids).toContain('b');
    expect(ids).toContain('c');
    expect(ids).toContain('d');
    expect(ids).toContain('e');
    expect(ids).toContain('f');
  });

  it('extracts both directions', () => {
    const result = dagSlice(largeGraph, 'd', { direction: 'both' });
    const ids = result.map(n => n.id);
    // Should include ancestors and descendants of d
    expect(ids).toContain('d');
    expect(ids).toContain('root');
    expect(ids).toContain('a');
    expect(ids).toContain('b');
    expect(ids).toContain('f');
  });

  it('respects depth limit', () => {
    const result = dagSlice(largeGraph, 'd', { direction: 'ancestors', depth: 1 });
    const ids = result.filter(n => !n._ghost).map(n => n.id);
    expect(ids).toContain('d');
    expect(ids).toContain('a');
    expect(ids).toContain('b');
    // Root should NOT be directly included (depth 2 away)
    expect(ids).not.toContain('root');
  });

  it('creates ghost nodes at boundary', () => {
    const result = dagSlice(largeGraph, 'd', { direction: 'ancestors', depth: 1 });
    const ghosts = result.filter(n => n._ghost);
    expect(ghosts.length).toBeGreaterThan(0);
    // Ghost should have a label like "... N ancestors"
    expect(ghosts.some(g => g.label.includes('ancestor'))).toBe(true);
  });

  it('creates descendant ghost nodes', () => {
    const result = dagSlice(largeGraph, 'root', { direction: 'descendants', depth: 1 });
    const ghosts = result.filter(n => n._ghost);
    expect(ghosts.length).toBeGreaterThan(0);
    expect(ghosts.some(g => g.label.includes('descendant'))).toBe(true);
  });

  it('ghost nodes render with dashed borders', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const sliced = dagSlice(largeGraph, 'd', { direction: 'ancestors', depth: 1 });
    const result = dag(sliced, { ctx });
    expect(result).toContain('╌');
  });

  it('sliced output can be passed to dag()', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const sliced = dagSlice(largeGraph, 'd', { direction: 'both', depth: 1 });
    const result = dag(sliced, { ctx });
    expect(result).toContain('D');
  });
});
