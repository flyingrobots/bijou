import { describe, it, expect } from 'vitest';
import { dag } from './dag.js';
import type { DagNode } from './dag.js';
import { arraySource } from './dag-source.js';
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

describe('DagSource adapter', () => {
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
});
