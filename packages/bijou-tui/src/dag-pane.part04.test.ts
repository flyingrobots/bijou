import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import type { DagNode } from '@flyingrobots/bijou';
import { createDagPaneState, dagPaneSelectLeft, dagPaneSelectRight } from './dag-pane.js';

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

describe('dagPaneSelectLeft / dagPaneSelectRight (siblings)', () => {
  it('moves left among siblings in same layer', () => {
    const state = createDagPaneState({ source: DIAMOND_NODES, width: 80, height: 20, selectedId: 'C', ctx });
    const next = dagPaneSelectLeft(state, ctx);
    // B and C are in the same layer — moving left should go to B
    // (B has smaller col position)
    expect(next.selectedId).toBe('B');
  });

  it('moves right among siblings in same layer', () => {
    const state = createDagPaneState({ source: DIAMOND_NODES, width: 80, height: 20, selectedId: 'B', ctx });
    const next = dagPaneSelectRight(state, ctx);
    expect(next.selectedId).toBe('C');
  });

  it('stays at left edge (no more siblings)', () => {
    const state = createDagPaneState({ source: DIAMOND_NODES, width: 80, height: 20, selectedId: 'B', ctx });
    const next = dagPaneSelectLeft(state, ctx);
    // B is already leftmost in its layer
    expect(next.selectedId).toBe('B');
  });

  it('stays at right edge (no more siblings)', () => {
    const state = createDagPaneState({ source: DIAMOND_NODES, width: 80, height: 20, selectedId: 'C', ctx });
    const next = dagPaneSelectRight(state, ctx);
    expect(next.selectedId).toBe('C');
  });

  it('auto-selects first root when nothing is selected', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, ctx });
    const next = dagPaneSelectLeft(state, ctx);
    expect(next.selectedId).toBe('A');
  });
});
