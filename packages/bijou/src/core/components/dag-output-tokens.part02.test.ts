import { describe, it, expect } from 'vitest';
import { dag, dagSlice } from './dag.js';
import type { DagNode } from './dag.js';
import { arraySource } from './dag-source.js';
import { createTestContext } from '../../adapters/test/index.js';

describe('DagNode labelToken / badgeToken', () => {
  it('labelToken renders node without error', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const nodes: DagNode[] = [
        { id: 'a', label: 'Alpha', labelToken: { hex: '#00ff00' } },
      ];
      const result = dag(nodes, { ctx });
      expect(result).toContain('Alpha');
      expect(result).toContain('╭');
    });

  it('badgeToken colors badge differently from border', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const nodes: DagNode[] = [
        { id: 'a', label: 'Build', badge: 'DONE', badgeToken: { hex: '#ff0000' } },
      ];
      const result = dag(nodes, { ctx });
      expect(result).toContain('Build');
      expect(result).toContain('DONE');
    });

  it('both labelToken and badgeToken together', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const nodes: DagNode[] = [
        {
          id: 'a',
          label: 'Deploy',
          badge: 'WIP',
          labelToken: { hex: '#00ff00' },
          badgeToken: { hex: '#ff0000' },
        },
      ];
      const result = dag(nodes, { ctx });
      expect(result).toContain('Deploy');
      expect(result).toContain('WIP');
    });

  it('falls back to node token when labelToken/badgeToken omitted', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const nodes: DagNode[] = [
        {
          id: 'a',
          label: 'Deploy',
          badge: 'OK',
          token: { hex: '#0000ff' },
          // no labelToken/badgeToken — should use token for all chars
        },
      ];
      const src = arraySource(nodes);
      // arraySource should return undefined for missing token overrides
      expect(src.labelToken?.('a')).toBeUndefined();
      expect(src.badgeToken?.('a')).toBeUndefined();
      // Should still render without error using the base token
      const result = dag(nodes, { ctx });
      expect(result).toContain('Deploy');
      expect(result).toContain('OK');
    });

  it('works with selectedId — selectedToken takes precedence for border', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const nodes: DagNode[] = [
        {
          id: 'a',
          label: 'Selected',
          labelToken: { hex: '#00ff00' },
          badgeToken: { hex: '#ff0000' },
          badge: 'TAG',
        },
      ];
      // Should not crash and should render
      const result = dag(nodes, { selectedId: 'a', ctx });
      expect(result).toContain('Selected');
      expect(result).toContain('TAG');
    });

  it('works through arraySource', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const nodes: DagNode[] = [
        {
          id: 'a',
          label: 'A',
          edges: ['b'],
          labelToken: { hex: '#00ff00' },
          bgToken: { hex: '#111111', bg: '#222222' },
          compactShape: 'round',
        },
        { id: 'b', label: 'B', badgeToken: { hex: '#ff0000' }, badge: 'X' },
      ];
      const src = arraySource(nodes);
      expect(src.bgToken?.('a')).toEqual({ hex: '#111111', bg: '#222222' });
      expect(src.compactShape?.('a')).toBe('round');
      expect(src.labelToken?.('a')).toEqual({ hex: '#00ff00' });
      expect(src.badgeToken?.('b')).toEqual({ hex: '#ff0000' });
      expect(src.labelToken?.('b')).toBeUndefined();
      expect(src.badgeToken?.('a')).toBeUndefined();
      const result = dag(src, { nodeStyle: 'compact', nodeWidth: 3, ctx });
      expect(result).toContain('(A)');
      expect(result).toContain('B');
    });

  it('works through dagSlice', () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
      const nodes: DagNode[] = [
        {
          id: 'a',
          label: 'A',
          edges: ['b'],
          labelToken: { hex: '#00ff00' },
          bgToken: { hex: '#111111', bg: '#222222' },
          compactShape: 'round',
        },
        { id: 'b', label: 'B', edges: ['c'], badgeToken: { hex: '#ff0000' }, badge: 'X' },
        { id: 'c', label: 'C' },
      ];
      const src = arraySource(nodes);
      const sliced = dagSlice(src, 'b', { direction: 'both', depth: 1 });
      // labelToken should be preserved for 'a'
      expect(sliced.labelToken?.('a')).toEqual({ hex: '#00ff00' });
      expect(sliced.bgToken?.('a')).toEqual({ hex: '#111111', bg: '#222222' });
      expect(sliced.compactShape?.('a')).toBe('round');
      // badgeToken should be preserved for 'b'
      expect(sliced.badgeToken?.('b')).toEqual({ hex: '#ff0000' });
      const result = dag(sliced, { nodeStyle: 'compact', nodeWidth: 3, ctx });
      expect(result).toContain('(A)');
      expect(result).toContain('B');
    });
});
