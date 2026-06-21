import { describe, it, expect } from 'vitest';
import type { DagNode } from './dag.js';
import { arraySource, isDagSource, isSlicedDagSource } from './dag-source.js';
import type { DagSource } from './dag-source.js';

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

describe('DagSource adapter', () => {
  describe('arraySource', () => {
      it('ids() returns all node IDs', () => {
        const src = arraySource(diamond);
        expect(src.ids()).toEqual(['a', 'b', 'c', 'd']);
      });

      it('has() returns true for known nodes', () => {
        const src = arraySource(diamond);
        expect(src.has('a')).toBe(true);
        expect(src.has('missing')).toBe(false);
      });

      it('label() returns node labels', () => {
        const src = arraySource(diamond);
        expect(src.label('a')).toBe('Start');
        expect(src.label('d')).toBe('End');
      });

      it('label() returns id for unknown nodes', () => {
        const src = arraySource(diamond);
        expect(src.label('missing')).toBe('missing');
      });

      it('children() returns edge targets', () => {
        const src = arraySource(diamond);
        expect(src.children('a')).toEqual(['b', 'c']);
        expect(src.children('d')).toEqual([]);
      });

      it('parents() returns computed parent IDs', () => {
        const src = arraySource(diamond);
        expect(src.parents?.('d')).toEqual(['b', 'c']);
        expect(src.parents?.('a')).toEqual([]);
      });

      it('badge() returns badge text', () => {
        const src = arraySource(withBadges);
        expect(src.badge?.('a')).toBe('DONE');
        expect(src.badge?.('b')).toBe('WIP');
      });

      it('token() returns per-node token', () => {
        const tokenNode: DagNode[] = [
          { id: 'x', label: 'X', token: { hex: '#ff0000' } },
        ];
        const src = arraySource(tokenNode);
        expect(src.token?.('x')).toEqual({ hex: '#ff0000' });
      });

      it('ghost() returns false for normal nodes', () => {
        const src = arraySource(diamond);
        expect(src.ghost('a')).toBe(false);
      });

      it('is both a DagSource and a SlicedDagSource', () => {
        const src = arraySource(diamond);
        expect(isDagSource(src)).toBe(true);
        expect(isSlicedDagSource(src)).toBe(true);
      });
    });

  describe('isDagSource', () => {
      it('returns true for DagSource objects', () => {
        expect(isDagSource(arraySource(diamond))).toBe(true);
      });

      it('returns true for unbounded DagSource', () => {
        const custom: DagSource = {
          has: () => true,
          label: () => '',
          children: () => [],
        };
        expect(isDagSource(custom)).toBe(true);
      });

      it('returns false for DagNode arrays', () => {
        expect(isDagSource(diamond)).toBe(false);
      });

      it('returns false for null/undefined/primitives', () => {
        expect(isDagSource(null)).toBe(false);
        expect(isDagSource(undefined)).toBe(false);
        expect(isDagSource(42)).toBe(false);
        expect(isDagSource('string')).toBe(false);
      });

      it('returns false for objects missing required methods', () => {
        expect(isDagSource({ has: () => true })).toBe(false);
        expect(isDagSource({ has: () => true, label: () => '' })).toBe(false);
      });
    });

  describe('isSlicedDagSource', () => {
      it('returns true for SlicedDagSource', () => {
        expect(isSlicedDagSource(arraySource(diamond))).toBe(true);
      });

      it('returns false for unbounded DagSource', () => {
        const custom: DagSource = {
          has: () => true,
          label: () => '',
          children: () => [],
        };
        expect(isSlicedDagSource(custom)).toBe(false);
      });
    });
});
