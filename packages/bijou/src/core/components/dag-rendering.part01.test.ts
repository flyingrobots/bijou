import { describe, it, expect } from 'vitest';
import { dag } from './dag.js';
import type { DagNode } from './dag.js';
import { createTestContext } from '../../adapters/test/index.js';
import { must } from '@flyingrobots/bijou/adapters/test';

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

const withBadges: DagNode[] = [
  { id: 'a', label: 'Build', edges: ['b'], badge: 'DONE' },
  { id: 'b', label: 'Test', edges: ['c'], badge: 'WIP' },
  { id: 'c', label: 'Deploy', badge: 'BLOCKED' },
];

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
        const boxMatch = /╭[─]+╮/.exec((must(topLine)));
        expect(boxMatch).toBeDefined();
        expect(boxMatch?.[0].length).toBe(30);
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
        const boxMatch = /╭[─]+╮/.exec((must(topLine)));
        expect(boxMatch).toBeDefined();
        expect(boxMatch?.[0].length).toBeGreaterThanOrEqual(16);
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
});
