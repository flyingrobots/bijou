import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import type { DagNode } from '@flyingrobots/bijou';
import { createDagPaneState, dagPaneClearSelection } from './dag-pane.js';

// ── Test Data ──────────────────────────────────────────────────────

/** Simple linear chain: A → B → C */
const LINEAR_NODES: DagNode[] = [
  { id: 'A', label: 'Alpha', edges: ['B'] },
  { id: 'B', label: 'Beta', edges: ['C'] },
  { id: 'C', label: 'Gamma' },
];

const ctx = createTestContext();

describe('dagPaneClearSelection', () => {
  it('clears the selection', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, selectedId: 'B', ctx });
    const next = dagPaneClearSelection(state, ctx);
    expect(next.selectedId).toBeUndefined();
    expect(next.highlightPath).toEqual([]);
  });
});
