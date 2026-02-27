import { describe, it, expect } from 'vitest';
import { dag, dagSlice, dagLayout } from './dag.js';
import type { DagNode } from './dag.js';
import { arraySource, isDagSource, isSlicedDagSource, sliceSource } from './dag-source.js';
import type { DagSource, SlicedDagSource } from './dag-source.js';
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

  // ── selectedId ──────────────────────────────────────────────────

  describe('selectedId', () => {
    it('renders with selectedId without error', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const result = dag(twoNodes, { selectedId: 'a', ctx });
      expect(result).toContain('Alpha');
      expect(result).toContain('Beta');
    });

    it('selectedId takes precedence over highlightPath', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      // Both highlight and select node 'a' — should not crash
      const result = dag(diamond, {
        selectedId: 'a',
        highlightPath: ['a', 'b', 'd'],
        highlightToken: { hex: '#ff0000' },
        ctx,
      });
      expect(result).toContain('Start');
    });

    it('non-selected nodes are unaffected', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const withSelected = dag(twoNodes, { selectedId: 'a', ctx });
      const without = dag(twoNodes, { ctx });
      // Both should contain Beta — it is not selected
      expect(withSelected).toContain('Beta');
      expect(without).toContain('Beta');
    });

    it('defaults to ui.cursor token when selectedToken omitted', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      // Should not throw — uses default cursor token
      const result = dag(twoNodes, { selectedId: 'a', ctx });
      expect(result).toContain('Alpha');
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
});

// ── DagSource Adapter Tests ───────────────────────────────────────

describe('DagSource adapter', () => {
  describe('arraySource', () => {
    it('ids() returns all node IDs', () => {
      const src = arraySource(diamond);
      expect(src.ids()).toEqual(['a', 'b', 'c', 'd']);
    });

    it('has() returns true for known nodes', () => {
      const src = arraySource(diamond);
      expect(src.has('a')).toBe(true);
      expect(src.has('missing')).toBe(false);
    });

    it('label() returns node labels', () => {
      const src = arraySource(diamond);
      expect(src.label('a')).toBe('Start');
      expect(src.label('d')).toBe('End');
    });

    it('label() returns id for unknown nodes', () => {
      const src = arraySource(diamond);
      expect(src.label('missing')).toBe('missing');
    });

    it('children() returns edge targets', () => {
      const src = arraySource(diamond);
      expect(src.children('a')).toEqual(['b', 'c']);
      expect(src.children('d')).toEqual([]);
    });

    it('parents() returns computed parent IDs', () => {
      const src = arraySource(diamond);
      expect(src.parents!('d')).toEqual(['b', 'c']);
      expect(src.parents!('a')).toEqual([]);
    });

    it('badge() returns badge text', () => {
      const src = arraySource(withBadges);
      expect(src.badge!('a')).toBe('DONE');
      expect(src.badge!('b')).toBe('WIP');
    });

    it('token() returns per-node token', () => {
      const tokenNode: DagNode[] = [
        { id: 'x', label: 'X', token: { hex: '#ff0000' } },
      ];
      const src = arraySource(tokenNode);
      expect(src.token!('x')).toEqual({ hex: '#ff0000' });
    });

    it('ghost() returns false for normal nodes', () => {
      const src = arraySource(diamond);
      expect(src.ghost('a')).toBe(false);
    });

    it('is both a DagSource and a SlicedDagSource', () => {
      const src = arraySource(diamond);
      expect(isDagSource(src)).toBe(true);
      expect(isSlicedDagSource(src)).toBe(true);
    });
  });

  describe('isDagSource', () => {
    it('returns true for DagSource objects', () => {
      expect(isDagSource(arraySource(diamond))).toBe(true);
    });

    it('returns true for unbounded DagSource', () => {
      const custom: DagSource = {
        has: () => true,
        label: () => '',
        children: () => [],
      };
      expect(isDagSource(custom)).toBe(true);
    });

    it('returns false for DagNode arrays', () => {
      expect(isDagSource(diamond)).toBe(false);
    });

    it('returns false for null/undefined/primitives', () => {
      expect(isDagSource(null)).toBe(false);
      expect(isDagSource(undefined)).toBe(false);
      expect(isDagSource(42)).toBe(false);
      expect(isDagSource('string')).toBe(false);
    });

    it('returns false for objects missing required methods', () => {
      expect(isDagSource({ has: () => true })).toBe(false);
      expect(isDagSource({ has: () => true, label: () => '' })).toBe(false);
    });
  });

  describe('isSlicedDagSource', () => {
    it('returns true for SlicedDagSource', () => {
      expect(isSlicedDagSource(arraySource(diamond))).toBe(true);
    });

    it('returns false for unbounded DagSource', () => {
      const custom: DagSource = {
        has: () => true,
        label: () => '',
        children: () => [],
      };
      expect(isSlicedDagSource(custom)).toBe(false);
    });
  });

  describe('dag() with SlicedDagSource', () => {
    it('renders same output as DagNode[] for equivalent input', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const fromArray = dag(diamond, { ctx });
      const fromSource = dag(arraySource(diamond), { ctx });
      expect(fromSource).toBe(fromArray);
    });

    it('works with pipe mode', () => {
      const ctx = createTestContext({ mode: 'pipe' });
      const fromArray = dag(twoNodes, { ctx });
      const fromSource = dag(arraySource(twoNodes), { ctx });
      expect(fromSource).toBe(fromArray);
    });

    it('works with accessible mode', () => {
      const ctx = createTestContext({ mode: 'accessible' });
      const fromArray = dag(diamond, { ctx });
      const fromSource = dag(arraySource(diamond), { ctx });
      expect(fromSource).toBe(fromArray);
    });

    it('handles empty source', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const src = arraySource([]);
      expect(dag(src, { ctx })).toBe('');
    });

    it('works with badges', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const fromArray = dag(withBadges, { ctx });
      const fromSource = dag(arraySource(withBadges), { ctx });
      expect(fromSource).toBe(fromArray);
    });

    it('works with fan-out', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 200 } });
      const fromArray = dag(fanOut, { ctx });
      const fromSource = dag(arraySource(fanOut), { ctx });
      expect(fromSource).toBe(fromArray);
    });
  });

  describe('dagSlice() with DagSource', () => {
    const largeGraph: DagNode[] = [
      { id: 'root', label: 'Root', edges: ['a', 'b'] },
      { id: 'a', label: 'A', edges: ['c', 'd'] },
      { id: 'b', label: 'B', edges: ['d', 'e'] },
      { id: 'c', label: 'C', edges: ['f'] },
      { id: 'd', label: 'D', edges: ['f'] },
      { id: 'e', label: 'E', edges: ['f'] },
      { id: 'f', label: 'F' },
    ];

    it('returns SlicedDagSource (not DagNode[])', () => {
      const src = arraySource(largeGraph);
      const result = dagSlice(src, 'd');
      expect(isSlicedDagSource(result)).toBe(true);
      expect(Array.isArray(result)).toBe(false);
    });

    it('still returns DagNode[] when given DagNode[]', () => {
      const result = dagSlice(largeGraph, 'd');
      expect(Array.isArray(result)).toBe(true);
    });

    it('sliced source is renderable with dag()', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const src = arraySource(largeGraph);
      const sliced = dagSlice(src, 'd', { direction: 'both', depth: 1 });
      const result = dag(sliced, { ctx });
      expect(result).toContain('D');
    });

    it('composable: slice of a slice works', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const src = arraySource(largeGraph);
      const neighborhood = dagSlice(src, 'd', { direction: 'both', depth: 2 });
      const narrower = dagSlice(neighborhood, 'd', { direction: 'descendants', depth: 1 });
      const result = dag(narrower, { ctx });
      expect(result).toContain('D');
      expect(result).toContain('F');
    });

    it('ghost nodes appear at boundaries', () => {
      const src = arraySource(largeGraph);
      const sliced = dagSlice(src, 'd', { direction: 'ancestors', depth: 1 });
      const ids = sliced.ids();
      const ghostIds = ids.filter(id => sliced.ghost(id));
      expect(ghostIds.length).toBeGreaterThan(0);
    });

    it('returns empty source for unknown focus', () => {
      const src = arraySource(largeGraph);
      const sliced = dagSlice(src, 'unknown');
      expect(sliced.ids()).toEqual([]);
    });

    it('produces equivalent output to array path', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const arrayResult = dag(dagSlice(largeGraph, 'd', { direction: 'ancestors', depth: 1 }), { ctx });
      const src = arraySource(largeGraph);
      const sourceResult = dag(dagSlice(src, 'd', { direction: 'ancestors', depth: 1 }), { ctx });
      expect(sourceResult).toBe(arrayResult);
    });

    it('throws when ancestor traversal requested without parents()', () => {
      const noParents: DagSource = {
        has: (id) => ['a', 'b'].includes(id),
        label: (id) => id,
        children: (id) => id === 'a' ? ['b'] : [],
      };
      expect(() => dagSlice(noParents, 'b', { direction: 'ancestors' })).toThrow(
        'source.parents() is required',
      );
    });

    it('descendants-only works without parents()', () => {
      const noParents: DagSource = {
        has: (id) => ['a', 'b', 'c'].includes(id),
        label: (id) => id,
        children: (id) => {
          if (id === 'a') return ['b'];
          if (id === 'b') return ['c'];
          return [];
        },
      };
      const sliced = dagSlice(noParents, 'a', { direction: 'descendants' });
      expect(sliced.ids()).toContain('a');
      expect(sliced.ids()).toContain('b');
      expect(sliced.ids()).toContain('c');
    });
  });

  describe('dagLayout() with SlicedDagSource', () => {
    it('returns same layout as DagNode[] for equivalent input', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const fromArray = dagLayout(diamond, { ctx });
      const fromSource = dagLayout(arraySource(diamond), { ctx });
      expect(fromSource.output).toBe(fromArray.output);
      expect(fromSource.width).toBe(fromArray.width);
      expect(fromSource.height).toBe(fromArray.height);
    });

    it('position map contains all source IDs', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const src = arraySource(diamond);
      const layout = dagLayout(src, { ctx });
      for (const id of src.ids()) {
        expect(layout.nodes.has(id)).toBe(true);
      }
    });

    it('handles empty source', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const layout = dagLayout(arraySource([]), { ctx });
      expect(layout.output).toBe('');
      expect(layout.nodes.size).toBe(0);
    });
  });

  describe('custom DagSource (unbounded → slice → render)', () => {
    it('slice then render with a hand-built DagSource', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const custom: DagSource = {
        has: (id) => ['x', 'y'].includes(id),
        label: (id) => id === 'x' ? 'Hello' : 'World',
        children: (id) => id === 'x' ? ['y'] : [],
        parents: (id) => id === 'y' ? ['x'] : [],
      };
      const sliced = dagSlice(custom, 'x', { direction: 'descendants' });
      const result = dag(sliced, { ctx });
      expect(result).toContain('Hello');
      expect(result).toContain('World');
      expect(result).toContain('▼');
    });

    it('works without optional badge/token methods', () => {
      const ctx = createTestContext({ mode: 'pipe' });
      const custom: DagSource = {
        has: (id) => ['p', 'q'].includes(id),
        label: (id) => id === 'p' ? 'Parent' : 'Child',
        children: (id) => id === 'p' ? ['q'] : [],
      };
      const sliced = dagSlice(custom, 'p', { direction: 'descendants' });
      const result = dag(sliced, { ctx });
      expect(result).toBe('Parent -> Child\nChild');
    });

    it('never calls ids() on the unbounded source', () => {
      let idsCalled = false;
      const custom: DagSource = {
        has: (id) => ['a', 'b', 'c'].includes(id),
        label: (id) => id,
        children: (id) => {
          if (id === 'a') return ['b'];
          if (id === 'b') return ['c'];
          return [];
        },
      };
      // Verify DagSource has no ids method
      expect((custom as SlicedDagSource).ids).toBeUndefined();
      // Monkey-patch to detect if anyone tries to call it
      (custom as Record<string, unknown>).ids = () => { idsCalled = true; return []; };
      const sliced = dagSlice(custom, 'a', { direction: 'descendants' });
      dag(sliced, { ctx: createTestContext({ mode: 'pipe' }) });
      expect(idsCalled).toBe(false);
    });

    it('works with a simulated large graph via DagSource', () => {
      // Simulate a graph with 1000 nodes but only render a 3-node slice
      const custom: DagSource = {
        has: (id) => id.startsWith('node-') && parseInt(id.split('-')[1]!) < 1000,
        label: (id) => `Node ${id.split('-')[1]}`,
        children: (id) => {
          const n = parseInt(id.split('-')[1]!);
          // Each node points to the next two
          const ch: string[] = [];
          if (n * 2 + 1 < 1000) ch.push(`node-${n * 2 + 1}`);
          if (n * 2 + 2 < 1000) ch.push(`node-${n * 2 + 2}`);
          return ch;
        },
        parents: (id) => {
          const n = parseInt(id.split('-')[1]!);
          if (n === 0) return [];
          return [`node-${Math.floor((n - 1) / 2)}`];
        },
      };
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const sliced = dagSlice(custom, 'node-5', { direction: 'both', depth: 1 });
      const ids = sliced.ids();
      // Should contain node-5, its parent (node-2), and its children (node-11, node-12)
      expect(ids).toContain('node-5');
      expect(ids).toContain('node-2');
      expect(ids).toContain('node-11');
      expect(ids).toContain('node-12');
      // Should NOT contain the whole graph
      expect(ids.length).toBeLessThan(10);
      // Should render
      const result = dag(sliced, { ctx });
      expect(result).toContain('Node 5');
    });
  });

  describe('sliceSource', () => {
    it('returns composable SlicedDagSource', () => {
      const src = arraySource([
        { id: 'a', label: 'A', edges: ['b'] },
        { id: 'b', label: 'B', edges: ['c'] },
        { id: 'c', label: 'C' },
      ]);
      const s1 = sliceSource(src, 'a', { direction: 'descendants', depth: 1 });
      expect(s1.ids()).toContain('a');
      expect(s1.ids()).toContain('b');
      // c is depth 2, should be a ghost
      const ghostIds = s1.ids().filter(id => s1.ghost(id));
      expect(ghostIds.length).toBe(1);
      expect(ghostIds[0]).toContain('ghost_descendants');
    });

    it('preserves badges and tokens through slicing', () => {
      const src = arraySource([
        { id: 'a', label: 'A', edges: ['b'], badge: 'OK', token: { hex: '#00ff00' } },
        { id: 'b', label: 'B' },
      ]);
      const sliced = sliceSource(src, 'a', { direction: 'descendants' });
      expect(sliced.badge!('a')).toBe('OK');
      expect(sliced.token!('a')).toEqual({ hex: '#00ff00' });
    });
  });
});
