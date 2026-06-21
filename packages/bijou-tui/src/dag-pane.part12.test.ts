import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import type { DagNode } from '@flyingrobots/bijou';
import { createDagPaneState, dagPaneSetSource } from './dag-pane.js';

// ── Test Data ──────────────────────────────────────────────────────

/** Simple linear chain: A → B → C */
const LINEAR_NODES: DagNode[] = [
  { id: 'A', label: 'Alpha', edges: ['B'] },
  { id: 'B', label: 'Beta', edges: ['C'] },
  { id: 'C', label: 'Gamma' },
];

/** Diamond graph: A → B, A → C, B → D, C → D */
const DIAMOND_NODES: DagNode[] = [
  { id: 'A', label: 'Root', edges: ['B', 'C'] },
  { id: 'B', label: 'Left', edges: ['D'] },
  { id: 'C', label: 'Right', edges: ['D'] },
  { id: 'D', label: 'Merge' },
];

const ctx = createTestContext();

// ── dagPaneSetSource ──────────────────────────────────────────────

describe('dagPaneSetSource', () => {
  it('updates source and re-renders layout', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, ctx });
    const next = dagPaneSetSource(state, DIAMOND_NODES, ctx);
    expect(next.source).toBe(DIAMOND_NODES);
    expect(next.layout.nodes.size).toBe(4);
  });

  it('clears selection', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, selectedId: 'B', ctx });
    const next = dagPaneSetSource(state, DIAMOND_NODES, ctx);
    expect(next.selectedId).toBeUndefined();
    expect(next.highlightPath).toEqual([]);
  });
});
