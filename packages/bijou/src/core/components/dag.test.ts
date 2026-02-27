import { describe, it, expect } from 'vitest';
import { dag, dagSlice } from './dag.js';
import type { DagNode } from './dag.js';
import { createTestContext } from '../../adapters/test/index.js';

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

// ── Basic Tests ────────────────────────────────────────────────────

describe('dag', () => {
  describe('basic rendering', () => {
    it('returns empty string for empty input', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      expect(dag([], { ctx })).toBe('');
    });

    it('renders a single node', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const result = dag([{ id: 'a', label: 'Only' }], { ctx });
      expect(result).toContain('Only');
      expect(result).toContain('╭');
      expect(result).toContain('╰');
    });

    it('renders two nodes with an edge', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const result = dag(twoNodes, { ctx });
      expect(result).toContain('Alpha');
      expect(result).toContain('Beta');
      expect(result).toContain('│');
      expect(result).toContain('▼');
    });

    it('renders a linear chain', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const result = dag(linear, { ctx });
      expect(result).toContain('First');
      expect(result).toContain('Second');
      expect(result).toContain('Third');
    });

    it('renders a diamond graph', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const result = dag(diamond, { ctx });
      expect(result).toContain('Start');
      expect(result).toContain('Left');
      expect(result).toContain('Right');
      expect(result).toContain('End');
    });

    it('renders fan-out correctly', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 200 } });
      const result = dag(fanOut, { ctx });
      expect(result).toContain('Root');
      expect(result).toContain('A');
      expect(result).toContain('B');
      expect(result).toContain('C');
      expect(result).toContain('D');
    });
  });

  // ── Mode Tests ──────────────────────────────────────────────────

  describe('pipe mode', () => {
    it('renders adjacency list', () => {
      const ctx = createTestContext({ mode: 'pipe' });
      const result = dag(twoNodes, { ctx });
      expect(result).toContain('Alpha -> Beta');
      expect(result).toContain('Beta');
    });

    it('renders node with no edges as standalone', () => {
      const ctx = createTestContext({ mode: 'pipe' });
      const result = dag([{ id: 'a', label: 'Alone' }], { ctx });
      expect(result).toBe('Alone');
    });

    it('renders multiple edges', () => {
      const ctx = createTestContext({ mode: 'pipe' });
      const result = dag(diamond, { ctx });
      expect(result).toContain('Start -> Left, Right');
      expect(result).toContain('Left -> End');
      expect(result).toContain('Right -> End');
      expect(result).toContain('End');
    });

    it('includes badges in parentheses', () => {
      const ctx = createTestContext({ mode: 'pipe' });
      const result = dag(withBadges, { ctx });
      expect(result).toContain('Build (DONE) -> Test');
      expect(result).toContain('Test (WIP) -> Deploy');
      expect(result).toContain('Deploy (BLOCKED)');
    });

    it('returns empty string for empty input', () => {
      const ctx = createTestContext({ mode: 'pipe' });
      expect(dag([], { ctx })).toBe('');
    });
  });

  describe('accessible mode', () => {
    it('renders structured text with layers', () => {
      const ctx = createTestContext({ mode: 'accessible' });
      const result = dag(twoNodes, { ctx });
      expect(result).toContain('Graph: 2 nodes, 1 edges');
      expect(result).toContain('Layer 1:');
      expect(result).toContain('Alpha -> Beta');
      expect(result).toContain('Layer 2:');
      expect(result).toContain('Beta (end)');
    });

    it('includes badges', () => {
      const ctx = createTestContext({ mode: 'accessible' });
      const result = dag(withBadges, { ctx });
      expect(result).toContain('Build (DONE) -> Test');
    });

    it('renders diamond with correct layers', () => {
      const ctx = createTestContext({ mode: 'accessible' });
      const result = dag(diamond, { ctx });
      expect(result).toContain('Graph: 4 nodes, 4 edges');
      expect(result).toContain('Layer 1:');
      expect(result).toContain('Layer 2:');
      expect(result).toContain('Layer 3:');
    });

    it('returns node count for empty', () => {
      const ctx = createTestContext({ mode: 'accessible' });
      expect(dag([], { ctx })).toBe('');
    });
  });

  // ── Layout Tests ────────────────────────────────────────────────

  describe('layout', () => {
    it('places root nodes at the top', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const result = dag(twoNodes, { ctx });
      const lines = result.split('\n');
      // Alpha should appear before Beta vertically
      const alphaLine = lines.findIndex(l => l.includes('Alpha'));
      const betaLine = lines.findIndex(l => l.includes('Beta'));
      expect(alphaLine).toBeLessThan(betaLine);
    });

    it('handles multi-layer skip edges', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const skipEdge: DagNode[] = [
        { id: 'a', label: 'Top', edges: ['b', 'c'] },
        { id: 'b', label: 'Middle', edges: ['c'] },
        { id: 'c', label: 'Bottom' },
      ];
      const result = dag(skipEdge, { ctx });
      expect(result).toContain('Top');
      expect(result).toContain('Middle');
      expect(result).toContain('Bottom');
    });
  });

  // ── Edge Characters ─────────────────────────────────────────────

  describe('edge characters', () => {
    it('renders vertical connector for straight edges', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const result = dag(twoNodes, { ctx });
      expect(result).toContain('│');
    });

    it('renders arrowhead', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const result = dag(twoNodes, { ctx });
      expect(result).toContain('▼');
    });

    it('renders horizontal connectors for fan-out', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 200 } });
      const result = dag(fanOut, { ctx });
      // Should have horizontal line characters
      expect(result).toMatch(/[─┬├┤┴┼┌┐└┘]/);
    });
  });

  // ── Features ────────────────────────────────────────────────────

  describe('features', () => {
    it('renders badges inside node boxes', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const result = dag(withBadges, { ctx });
      expect(result).toContain('DONE');
      expect(result).toContain('WIP');
      expect(result).toContain('BLOCKED');
    });

    it('respects nodeWidth override', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 200 } });
      const result = dag(twoNodes, { nodeWidth: 30, ctx });
      const lines = result.split('\n');
      // Box top line should be 30 chars wide
      const topLine = lines.find(l => l.includes('╭'));
      expect(topLine).toBeDefined();
      // Count the box chars (╭ + ─ repeated + ╮)
      const boxMatch = topLine!.match(/╭[─]+╮/);
      expect(boxMatch).toBeDefined();
      expect(boxMatch![0].length).toBe(30);
    });

    it('does not crash with highlightPath', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const result = dag(diamond, {
        highlightPath: ['a', 'b', 'd'],
        highlightToken: { hex: '#ff0000' },
        ctx,
      });
      expect(result).toContain('Start');
      expect(result).toContain('End');
    });
  });

  // ── Width Adaptation ────────────────────────────────────────────

  describe('width adaptation', () => {
    it('auto-sizes node width from labels', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 200 } });
      const nodes: DagNode[] = [
        { id: 'a', label: 'A very long label here', edges: ['b'] },
        { id: 'b', label: 'Short' },
      ];
      const result = dag(nodes, { ctx });
      expect(result).toContain('A very long label here');
    });

    it('enforces minimum width of 16', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 200 } });
      const nodes: DagNode[] = [{ id: 'a', label: 'Hi' }];
      const result = dag(nodes, { ctx });
      const lines = result.split('\n');
      const topLine = lines.find(l => l.includes('╭'));
      const boxMatch = topLine!.match(/╭[─]+╮/);
      expect(boxMatch).toBeDefined();
      expect(boxMatch![0].length).toBeGreaterThanOrEqual(16);
    });

    it('truncates labels when maxWidth is small', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 30 } });
      const nodes: DagNode[] = [
        { id: 'a', label: 'A very long label that should be truncated', edges: ['b'] },
        { id: 'b', label: 'Another very long label' },
      ];
      const result = dag(nodes, { maxWidth: 30, ctx });
      // Should still render without error
      expect(result).toBeDefined();
    });
  });

  // ── Error Cases ─────────────────────────────────────────────────

  describe('errors', () => {
    it('throws on cycle detection', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const cyclic: DagNode[] = [
        { id: 'a', label: 'A', edges: ['b'] },
        { id: 'b', label: 'B', edges: ['a'] },
      ];
      expect(() => dag(cyclic, { ctx })).toThrow('cycle detected');
    });

    it('throws on self-loop', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const selfLoop: DagNode[] = [
        { id: 'a', label: 'A', edges: ['a'] },
      ];
      expect(() => dag(selfLoop, { ctx })).toThrow('cycle detected');
    });

    it('ignores dangling edge targets without false cycle error', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const dangling: DagNode[] = [
        { id: 'a', label: 'A', edges: ['missing'] },
        { id: 'b', label: 'B' },
      ];
      // Should not throw — dangling edges are silently ignored
      const result = dag(dangling, { ctx });
      expect(result).toContain('A');
      expect(result).toContain('B');
      expect(result).not.toContain('missing');
    });
  });
});

// ── dagSlice Tests ─────────────────────────────────────────────────

describe('dagSlice', () => {
  const largeGraph: DagNode[] = [
    { id: 'root', label: 'Root', edges: ['a', 'b'] },
    { id: 'a', label: 'A', edges: ['c', 'd'] },
    { id: 'b', label: 'B', edges: ['d', 'e'] },
    { id: 'c', label: 'C', edges: ['f'] },
    { id: 'd', label: 'D', edges: ['f'] },
    { id: 'e', label: 'E', edges: ['f'] },
    { id: 'f', label: 'F' },
  ];

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

  it('extracts descendants', () => {
    const result = dagSlice(largeGraph, 'root', { direction: 'descendants' });
    const ids = result.map(n => n.id);
    expect(ids).toContain('root');
    expect(ids).toContain('a');
    expect(ids).toContain('b');
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
