import { describe, it, expect } from 'vitest';
import { dag, dagSlice, dagLayout } from './dag.js';
import type { DagNode } from './dag.js';
import { arraySource, isSlicedDagSource, sliceSource } from './dag-source.js';
import type { DagSource } from './dag-source.js';
import { createTestContext } from '../../adapters/test/index.js';
import { must } from '@flyingrobots/bijou/adapters/test';
// ── Test Data ──────────────────────────────────────────────────────
const diamond: DagNode[] = [
  { id: 'a', label: 'Start', edges: ['b', 'c'] },
  { id: 'b', label: 'Left', edges: ['d'] },
  { id: 'c', label: 'Right', edges: ['d'] },
  { id: 'd', label: 'End' },
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
describe('DagSource adapter', () => {
  describe('dagSlice() with DagSource', () => {
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
      expect(sliced.badge?.('a')).toBe('OK');
      expect(sliced.token?.('a')).toEqual({ hex: '#00ff00' });
    });
    it('arraySource.children() does not leak mutable references', () => {
      const nodes: DagNode[] = [
        { id: 'a', label: 'A', edges: ['b'] },
        { id: 'b', label: 'B' },
      ];
      const src = arraySource(nodes);
      const children1 = src.children('a');
      const children2 = src.children('a');
      // Should be equal by value but not by reference
      expect(children1).toEqual(children2);
      expect(children1).not.toBe(children2);
    });
    it('arraySource.parents() does not leak mutable references', () => {
      const nodes: DagNode[] = [
        { id: 'a', label: 'A', edges: ['b'] },
        { id: 'b', label: 'B' },
      ];
      const src = arraySource(nodes);
      const parents1 = src.parents?.('b');
      const parents2 = src.parents?.('b');
      expect(parents1).toEqual(parents2);
      expect(parents1).not.toBe(parents2);
    });
    it('sliceSource ghost children() does not leak mutable references', () => {
      const src = arraySource([
        { id: 'a', label: 'A', edges: ['b'] },
        { id: 'b', label: 'B', edges: ['c'] },
        { id: 'c', label: 'C' },
      ]);
      const sliced = sliceSource(src, 'a', { direction: 'descendants', depth: 1 });
      const ghostIds = sliced.ids().filter(id => sliced.ghost(id));
      expect(ghostIds.length).toBe(1);
      const children1 = sliced.children(must(ghostIds[0]));
      const children2 = sliced.children(must(ghostIds[0]));
      expect(children1).not.toBe(children2);
    });
    it('isSlicedDagSource rejects objects missing ghostLabel', () => {
      const partial = {
        has: () => true,
        label: () => '',
        children: () => [],
        ids: () => [],
        ghost: () => false,
        // no ghostLabel
      };
      expect(isSlicedDagSource(partial)).toBe(false);
    });
    it('preserves inherited ghost status in slice-of-slice', () => {
      // a -> b -> c -> d
      const src = arraySource([
        { id: 'a', label: 'A', edges: ['b'] },
        { id: 'b', label: 'B', edges: ['c'] },
        { id: 'c', label: 'C', edges: ['d'] },
        { id: 'd', label: 'D' },
      ]);
      // First slice: depth 1 from b => b, c, ghost for d
      const s1 = sliceSource(src, 'b', { direction: 'descendants', depth: 1 });
      const s1Ghosts = s1.ids().filter(id => s1.ghost(id));
      expect(s1Ghosts.length).toBe(1);
      // Second slice of s1: depth Infinity from b => includes b, c, and the ghost
      const s2 = sliceSource(s1, 'b', { direction: 'descendants' });
      for (const gid of s1Ghosts) {
        if (s2.has(gid)) {
          expect(s2.ghost(gid)).toBe(true);
        }
      }
    });
  });
});
