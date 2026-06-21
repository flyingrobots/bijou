import { describe, it, expect } from 'vitest';
import { dag, dagSlice } from './dag.js';
import type { DagSource } from './dag-source.js';
import { createTestContext } from '../../adapters/test/index.js';

describe('DagSource adapter', () => {
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
        expect(result).toContain('Parent -> Child');
        // Verify the standalone node label appears on its own line
        const lines = result.split('\n');
        expect(lines.some(l => l.trim() === 'Child')).toBe(true);
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
        expect('ids' in custom).toBe(false);
        Object.defineProperty(custom, 'ids', {
          value: () => { idsCalled = true; return []; },
        });
        const sliced = dagSlice(custom, 'a', { direction: 'descendants' });
        dag(sliced, { ctx: createTestContext({ mode: 'pipe' }) });
        expect(idsCalled).toBe(false);
      });
      it('works with a simulated large graph via DagSource', () => {
        // Simulate a graph with 1000 nodes but only render a 3-node slice
        const nodeIndex = (id: string): number => {
          const n = parseInt(id.split('-')[1] ?? '', 10);
          if (Number.isNaN(n)) throw new Error(`Invalid node ID: ${id}`);
          return n;
        };
        const custom: DagSource = {
          has: (id) => id.startsWith('node-') && nodeIndex(id) < 1000,
          label: (id) => `Node ${nodeIndex(id).toString()}`,
          children: (id) => {
            const n = nodeIndex(id);
            const ch: string[] = [];
            if (n * 2 + 1 < 1000) ch.push(`node-${(n * 2 + 1).toString()}`);
            if (n * 2 + 2 < 1000) ch.push(`node-${(n * 2 + 2).toString()}`);
            return ch;
          },
          parents: (id) => {
            const n = nodeIndex(id);
            if (n === 0) return [];
            return [`node-${Math.floor((n - 1) / 2).toString()}`];
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
});
