import { describe, it, expect } from 'vitest';
import { dag, dagLayout } from './dag.js';
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

const fanOut: DagNode[] = [
  { id: 'root', label: 'Root', edges: ['a', 'b', 'c', 'd'] },
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' },
  { id: 'c', label: 'C' },
  { id: 'd', label: 'D' },
];

const cyclic: DagNode[] = [
  { id: 'a', label: 'A', edges: ['b'] },
  { id: 'b', label: 'B', edges: ['a'] },
];

// ── dagLayout Tests ────────────────────────────────────────────────

describe('dagLayout', () => {
  it('dagLayout().output === dag() for same inputs', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const layout = dagLayout(diamond, { ctx });
    const dagStr = dag(diamond, { ctx });
    expect(layout.output).toBe(dagStr);
  });

  it('empty nodes return empty layout', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const layout = dagLayout([], { ctx });
    expect(layout.output).toBe('');
    expect(layout.nodes.size).toBe(0);
    expect(layout.width).toBe(0);
    expect(layout.height).toBe(0);
  });

  it('positions map contains all node IDs', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const layout = dagLayout(diamond, { ctx });
    for (const n of diamond) {
      expect(layout.nodes.has(n.id)).toBe(true);
    }
  });

  it('positions have valid coordinates', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 200 } });
    const layout = dagLayout(fanOut, { ctx });
    for (const [, pos] of layout.nodes) {
      expect(pos.row).toBeGreaterThanOrEqual(0);
      expect(pos.col).toBeGreaterThanOrEqual(0);
      expect(pos.row).toBeLessThan(layout.height);
      expect(pos.col).toBeLessThan(layout.width);
      expect(pos.height).toBe(3);
    }
  });

  it('width/height > 0 for non-empty graphs', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const layout = dagLayout(twoNodes, { ctx });
    expect(layout.width).toBeGreaterThan(0);
    expect(layout.height).toBeGreaterThan(0);
  });

  it('works with selectedId', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const layout = dagLayout(diamond, { selectedId: 'a', ctx });
    expect(layout.output).toContain('Start');
    expect(layout.nodes.has('a')).toBe(true);
  });

  it('returns positions for cyclic graphs instead of throwing', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const layout = dagLayout(cyclic, { ctx });
    expect(layout.output).toContain('A');
    expect(layout.output).toContain('B');
    expect(layout.nodes.has('a')).toBe(true);
    expect(layout.nodes.has('b')).toBe(true);
  });
});
