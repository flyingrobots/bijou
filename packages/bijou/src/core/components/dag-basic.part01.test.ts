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
});
