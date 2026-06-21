import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import type { DagNode } from '@flyingrobots/bijou';
import { createDagPaneState, dagPaneSelectParent } from './dag-pane.js';

// ── Test Data ──────────────────────────────────────────────────────

/** Simple linear chain: A → B → C */
const LINEAR_NODES: DagNode[] = [
  { id: 'A', label: 'Alpha', edges: ['B'] },
  { id: 'B', label: 'Beta', edges: ['C'] },
  { id: 'C', label: 'Gamma' },
];

const ctx = createTestContext();

describe('dagPaneSelectParent (arrow up)', () => {
  it('auto-selects first root when nothing is selected', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, ctx });
    const next = dagPaneSelectParent(state, ctx);
    expect(next.selectedId).toBe('A');
  });

  it('moves to parent node', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, selectedId: 'B', ctx });
    const next = dagPaneSelectParent(state, ctx);
    expect(next.selectedId).toBe('A');
  });

  it('stays on root node (no parents)', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, selectedId: 'A', ctx });
    const next = dagPaneSelectParent(state, ctx);
    expect(next.selectedId).toBe('A');
  });
});
