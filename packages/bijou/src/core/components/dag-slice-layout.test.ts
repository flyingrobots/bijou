import { describe, it, expect } from 'vitest';
import { dag, dagSlice, dagLayout } from './dag.js';
import type { DagNode } from './dag.js';
import { arraySource, isDagSource, isSlicedDagSource, sliceSource } from './dag-source.js';
import type { DagSource, SlicedDagSource } from './dag-source.js';
import { auditStyle, createTestContext } from '../../adapters/test/index.js';

// ── Test Data ──────────────────────────────────────────────────────

const twoNodes: DagNode[] = [
  { id: 'a', label: 'Alpha', edges: ['b'] },
  { id: 'b', label: 'Beta' },
];

const diamond: DagNode[] = [
  { id: 'a', label: 'Start', edges: ['b', 'c'] },
  { id: 'b', label: 'Left', edges: ['d'] },
  { id: 'c', label: 'Right', edges: ['d'] },
  { id: 'd', label: 'End' },
];

const compactDiamond: DagNode[] = [
  { id: 'a', label: 'A', edges: ['b', 'c'] },
  { id: 'b', label: 'B', edges: ['d'] },
  { id: 'c', label: 'C', edges: ['d'] },
  { id: 'd', label: 'D' },
];

const linear: DagNode[] = [
  { id: 'a', label: 'First', edges: ['b'] },
  { id: 'b', label: 'Second', edges: ['c'] },
  { id: 'c', label: 'Third' },
];

const fanOut: DagNode[] = [
  { id: 'root', label: 'Root', edges: ['a', 'b', 'c', 'd'] },
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' },
  { id: 'c', label: 'C' },
  { id: 'd', label: 'D' },
];

const withBadges: DagNode[] = [
  { id: 'a', label: 'Build', edges: ['b'], badge: 'DONE' },
  { id: 'b', label: 'Test', edges: ['c'], badge: 'WIP' },
  { id: 'c', label: 'Deploy', badge: 'BLOCKED' },
];

const cyclic: DagNode[] = [
  { id: 'a', label: 'A', edges: ['b'] },
  { id: 'b', label: 'B', edges: ['a'] },
];

const selfLoop: DagNode[] = [
  { id: 'a', label: 'A', edges: ['a'] },
];

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

// ── dagLayout Tests ────────────────────────────────────────────────

describe('dagLayout', () => {
  it('dagLayout().output === dag() for same inputs', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const layout = dagLayout(diamond, { ctx });
    const dagStr = dag(diamond, { ctx });
    expect(layout.output).toBe(dagStr);
  });

  it('empty nodes return empty layout', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const layout = dagLayout([], { ctx });
    expect(layout.output).toBe('');
    expect(layout.nodes.size).toBe(0);
    expect(layout.width).toBe(0);
    expect(layout.height).toBe(0);
  });

  it('positions map contains all node IDs', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const layout = dagLayout(diamond, { ctx });
    for (const n of diamond) {
      expect(layout.nodes.has(n.id)).toBe(true);
    }
  });

  it('positions have valid coordinates', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 200 } });
    const layout = dagLayout(fanOut, { ctx });
    for (const [, pos] of layout.nodes) {
      expect(pos.row).toBeGreaterThanOrEqual(0);
      expect(pos.col).toBeGreaterThanOrEqual(0);
      expect(pos.row).toBeLessThan(layout.height);
      expect(pos.col).toBeLessThan(layout.width);
      expect(pos.height).toBe(3);
    }
  });

  it('width/height > 0 for non-empty graphs', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const layout = dagLayout(twoNodes, { ctx });
    expect(layout.width).toBeGreaterThan(0);
    expect(layout.height).toBeGreaterThan(0);
  });

  it('works with selectedId', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const layout = dagLayout(diamond, { selectedId: 'a', ctx });
    expect(layout.output).toContain('Start');
    expect(layout.nodes.has('a')).toBe(true);
  });

  it('returns positions for cyclic graphs instead of throwing', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const layout = dagLayout(cyclic, { ctx });
    expect(layout.output).toContain('A');
    expect(layout.output).toContain('B');
    expect(layout.nodes.has('a')).toBe(true);
    expect(layout.nodes.has('b')).toBe(true);
  });
});

// ── DagSource Adapter Tests ───────────────────────────────────────
