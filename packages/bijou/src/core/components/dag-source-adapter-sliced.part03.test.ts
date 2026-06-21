import { describe, it, expect } from 'vitest';
import type { DagNode } from './dag.js';
import { arraySource, isSlicedDagSource, sliceSource } from './dag-source.js';
import { must } from '@flyingrobots/bijou/adapters/test';

describe('DagSource adapter', () => {
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
