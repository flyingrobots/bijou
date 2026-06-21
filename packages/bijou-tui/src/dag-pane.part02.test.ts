import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import type { DagNode } from '@flyingrobots/bijou';
import { createDagPaneState, dagPaneSelectChild } from './dag-pane.js';

// ── Test Data ──────────────────────────────────────────────────────

/** Simple linear chain: A → B → C */
const LINEAR_NODES: DagNode[] = [
  { id: 'A', label: 'Alpha', edges: ['B'] },
  { id: 'B', label: 'Beta', edges: ['C'] },
  { id: 'C', label: 'Gamma' },
];

const ctx = createTestContext();

// ── Arrow key navigation ──────────────────────────────────────────

describe('dagPaneSelectChild (arrow down)', () => {
  it('auto-selects first root when nothing is selected', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, ctx });
    const next = dagPaneSelectChild(state, ctx);
    expect(next.selectedId).toBeDefined();
    // Should select a root node (A in the linear chain)
    expect(next.selectedId).toBe('A');
  });

  it('moves to child node', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, selectedId: 'A', ctx });
    const next = dagPaneSelectChild(state, ctx);
    expect(next.selectedId).toBe('B');
  });

  it('stays on leaf node (no children)', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, selectedId: 'C', ctx });
    const next = dagPaneSelectChild(state, ctx);
    expect(next.selectedId).toBe('C');
  });

  it('updates highlight path', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, selectedId: 'A', ctx });
    const next = dagPaneSelectChild(state, ctx);
    expect(next.highlightPath).toContain('A');
    expect(next.highlightPath).toContain('B');
  });
});
