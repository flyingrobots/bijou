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

describe('dag', () => {
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
});
