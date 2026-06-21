import { describe, it, expect } from 'vitest';
import { dag, dagSlice } from './dag.js';
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

const withBadges: DagNode[] = [
  { id: 'a', label: 'Build', edges: ['b'], badge: 'DONE' },
  { id: 'b', label: 'Test', edges: ['c'], badge: 'WIP' },
  { id: 'c', label: 'Deploy', badge: 'BLOCKED' },
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

describe('render output stability', () => {
  it('two-node linear graph snapshot', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const output = dag(twoNodes, { ctx });
    // Capture the exact output to detect regressions during refactoring.
    // If the rendering algorithm changes, update this snapshot deliberately.
    expect(output).toMatchSnapshot();
  });

  it('diamond graph snapshot', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const output = dag(diamond, { ctx });
    expect(output).toMatchSnapshot();
  });

  it('linear chain snapshot', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const output = dag(linear, { ctx });
    expect(output).toMatchSnapshot();
  });

  it('fan-out graph snapshot', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 200 } });
    const output = dag(fanOut, { ctx });
    expect(output).toMatchSnapshot();
  });

  it('badges graph snapshot', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const output = dag(withBadges, { ctx });
    expect(output).toMatchSnapshot();
  });

  it('single node snapshot', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const output = dag([{ id: 'a', label: 'Only' }], { ctx });
    expect(output).toMatchSnapshot();
  });

  it('highlighted path snapshot', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const output = dag(diamond, {
      highlightPath: ['a', 'b', 'd'],
      highlightToken: { hex: '#ff0000' },
      ctx,
    });
    expect(output).toMatchSnapshot();
  });

  it('selected node snapshot', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const output = dag(twoNodes, { selectedId: 'a', ctx });
    expect(output).toMatchSnapshot();
  });

  it('ghost nodes snapshot', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const sliced = dagSlice(largeGraph, 'd', { direction: 'ancestors', depth: 1 });
    const output = dag(sliced, { ctx });
    expect(output).toMatchSnapshot();
  });
});
