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

describe('dag', () => {
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

    it('tightens sibling spacing for compact nodeWidth overrides', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 40 } });
      const result = dag(compactDiamond, { nodeWidth: 5, ctx });
      expect(result).toContain('╭───╮ ╭───╮');
      expect(result).not.toContain('╭───╮    ╭───╮');
    });

    it('renders with highlightPath without error', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const result = dag(diamond, {
        highlightPath: ['a', 'b', 'd'],
        highlightToken: { hex: '#ff0000' },
        ctx,
      });
      expect(result).toContain('Start');
      expect(result).toContain('Left');
      expect(result).toContain('End');
    });

    it('supports heavy, double, and dashed edge styles', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 80 } });
      const heavy = dag(compactDiamond, { nodeWidth: 5, edgeStyle: 'heavy', ctx });
      const double = dag(compactDiamond, { nodeWidth: 5, edgeStyle: 'double', ctx });
      const dashed = dag(compactDiamond, { nodeWidth: 5, edgeStyle: 'dashed', ctx });

      expect(heavy).toContain('┃');
      expect(heavy).toContain('━');
      expect(double).toContain('║');
      expect(double).toContain('═');
      expect(dashed).toContain('╌');
      expect(dashed).toContain('▾');
    });

    it('supports compact node style', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 40 } });
      const result = dag(compactDiamond, { nodeStyle: 'compact', nodeWidth: 3, ctx });
      expect(result).toContain('[A]');
      expect(result).toContain('[B]');
      expect(result).toContain('[C]');
      expect(result).toContain('[D]');
    });

    it('supports compact per-node shapes', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 40 } });
      const result = dag([
        { id: 'a', label: 'A', edges: ['b', 'c', 'd', 'e'], compactShape: 'square' },
        { id: 'b', label: 'B', compactShape: 'round' },
        { id: 'c', label: 'C', compactShape: 'angle' },
        { id: 'd', label: 'D', compactShape: 'brace' },
        { id: 'e', label: 'E', compactShape: 'plain' },
      ], { nodeStyle: 'compact', nodeWidth: 3, ctx });
      expect(result).toContain('[A]');
      expect(result).toContain('(B)');
      expect(result).toContain('<C>');
      expect(result).toContain('{D}');
      expect(result).toMatch(/\sE(?:\n|$)/);
    });

    it('centers labels inside boxed nodes', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 40 } });
      const result = dag([{ id: 'a', label: 'Parse' }], { nodeWidth: 14, ctx });
      expect(result).toContain('│   Parse    │');
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
      const longLabel = 'A very long label that should be truncated';
      const nodes: DagNode[] = [
        { id: 'a', label: longLabel, edges: ['b'] },
        { id: 'b', label: 'Another very long label' },
      ];
      const result = dag(nodes, { maxWidth: 30, ctx });
      // Full long label should NOT appear (it was truncated)
      expect(result).not.toContain(longLabel);
      // Ellipsis should be present from truncation
      expect(result).toContain('\u2026');
    });
  });

  // ── Error Cases ─────────────────────────────────────────────────

  describe('errors', () => {
    it('renders cyclic graphs without throwing', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const result = dag(cyclic, { ctx });
      expect(result).toContain('A');
      expect(result).toContain('B');
    });

    it('renders self-loops without throwing', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const result = dag(selfLoop, { ctx });
      expect(result).toContain('A');
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

    it('throws explicit error on duplicate node IDs', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const dupes: DagNode[] = [
        { id: 'a', label: 'First A', edges: ['b'] },
        { id: 'a', label: 'Second A', edges: ['b'] },
        { id: 'b', label: 'B' },
      ];
      expect(() => dag(dupes, { ctx })).toThrow('duplicate node id "a"');
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
      const result = dag(twoNodes, { selectedId: 'a', ctx });
      // Both nodes should be present in output
      expect(result).toContain('Alpha');
      expect(result).toContain('Beta');
    });

    it('defaults to ui.cursor token when selectedToken omitted', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      // Should not throw — uses default cursor token
      const layout = dagLayout(twoNodes, { selectedId: 'a', ctx });
      expect(layout.output).toContain('Alpha');
      expect(layout.nodes.has('a')).toBe(true);
    });
  });
});

// ── dagSlice Tests ─────────────────────────────────────────────────
