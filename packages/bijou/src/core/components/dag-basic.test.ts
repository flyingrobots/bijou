import { describe, it, expect } from 'vitest';
import { dag } from './dag.js';
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

const cyclic: DagNode[] = [
  { id: 'a', label: 'A', edges: ['b'] },
  { id: 'b', label: 'B', edges: ['a'] },
];

const selfLoop: DagNode[] = [
  { id: 'a', label: 'A', edges: ['a'] },
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

    it('sanitizes non-finite sizing overrides', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 40 } });
      const result = dag(twoNodes, {
        nodeWidth: Number.NaN,
        maxWidth: 30.9,
        ctx,
      });
      expect(result).toContain('Alpha');
      expect(result).toContain('Beta');
    });
  });

  describe('non-BMP characters (emoji)', () => {
    it('renders emoji label without charTypes/chars length mismatch', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const nodes: DagNode[] = [
        { id: 'a', label: '🚀 Deploy', edges: ['b'] },
        { id: 'b', label: 'Done' },
      ];
      const result = dag(nodes, { ctx });
      expect(result).toContain('🚀 Deploy');
      expect(result).toContain('Done');
    });

    it('renders emoji badge without charTypes/chars length mismatch', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const nodes: DagNode[] = [
        { id: 'a', label: 'Build', badge: '✅' },
      ];
      const result = dag(nodes, { ctx });
      expect(result).toContain('Build');
      expect(result).toContain('✅');
    });
  });

  describe('CJK wide characters', () => {
    it('renders CJK label without corruption', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const nodes: DagNode[] = [
        { id: 'a', label: '漢字', edges: ['b'] },
        { id: 'b', label: 'Done' },
      ];
      const result = dag(nodes, { ctx });
      expect(result).toContain('漢字');
      expect(result).toContain('Done');
    });

    it('renders mixed ASCII + CJK label', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const nodes: DagNode[] = [
        { id: 'a', label: 'hi漢字!' },
      ];
      const result = dag(nodes, { ctx });
      expect(result).toContain('hi漢字!');
    });

    it('renders CJK badge correctly', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const nodes: DagNode[] = [
        { id: 'a', label: 'Task', badge: '完了' },
      ];
      const result = dag(nodes, { ctx });
      expect(result).toContain('Task');
      expect(result).toContain('完了');
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

    it('renders one pipe line per edge when a node fans out', () => {
      const ctx = createTestContext({ mode: 'pipe' });
      const result = dag(diamond, { ctx });
      expect(result.split('\n')).toEqual([
        'Start -> Left',
        'Start -> Right',
        'Left -> End',
        'Right -> End',
        'End',
      ]);
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

    it('edge count excludes dangling edges in summary', () => {
      const ctx = createTestContext({ mode: 'accessible' });
      const nodes: DagNode[] = [
        { id: 'a', label: 'A', edges: ['b', 'ghost'] },
        { id: 'b', label: 'B' },
      ];
      const result = dag(nodes, { ctx });
      // 'ghost' is not in the graph, so only 1 edge (a→b) should be counted
      expect(result).toContain('Graph: 2 nodes, 1 edges');
      expect(result).not.toContain('2 edges');
    });

    it('renders cyclic graphs by ignoring cycle-forming edges for layering', () => {
      const ctx = createTestContext({ mode: 'accessible' });
      const result = dag(cyclic, { ctx });
      expect(result).toContain('Graph: 2 nodes, 2 edges');
      expect(result).toContain('Layer 1:');
      expect(result).toContain('Layer 2:');
      expect(result).toContain('A -> B');
      expect(result).toContain('B -> A');
    });

    it('renders self-loops without failing the accessibility path', () => {
      const ctx = createTestContext({ mode: 'accessible' });
      const result = dag(selfLoop, { ctx });
      expect(result).toContain('Graph: 1 nodes, 1 edges');
      expect(result).toContain('Layer 1:');
      expect(result).toContain('A -> A');
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

    it('keeps layer-skipping edges visible when another node sits in the same column', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const nodes: DagNode[] = [
        { id: 'a', label: 'A', edges: ['b', 'c'] },
        { id: 'b', label: 'B', edges: ['c'] },
        { id: 'c', label: 'C' },
      ];
      const result = dag(nodes, { ctx });

      expect(result).toContain('A');
      expect(result).toContain('B');
      expect(result).toContain('C');
      expect(result).toMatch(/[─┌┐┬┴┼├┤]/);
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

});
