import { describe, it, expect } from 'vitest';
import { dag, dagSlice, dagLayout } from './dag.js';
import type { DagNode } from './dag.js';
import { arraySource, isSlicedDagSource } from './dag-source.js';
import type { DagSource } from './dag-source.js';
import { createTestContext } from '../../adapters/test/index.js';

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
});
