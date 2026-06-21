import { describe, it, expect } from 'vitest';
import { dag } from './dag.js';
import type { DagNode } from './dag.js';
import { createTestContext } from '../../adapters/test/index.js';

// ── Test Data ──────────────────────────────────────────────────────

const twoNodes: DagNode[] = [
  { id: 'a', label: 'Alpha', edges: ['b'] },
  { id: 'b', label: 'Beta' },
];

const fanOut: DagNode[] = [
  { id: 'root', label: 'Root', edges: ['a', 'b', 'c', 'd'] },
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' },
  { id: 'c', label: 'C' },
  { id: 'd', label: 'D' },
];

describe('dag', () => {
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
});
