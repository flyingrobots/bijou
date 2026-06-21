import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import type { DagNode } from '@flyingrobots/bijou';
import { createDagPaneState, dagPaneScrollBy, dagPanePageDown, dagPanePageUp } from './dag-pane.js';

// ── Test Data ──────────────────────────────────────────────────────

/** Simple linear chain: A → B → C */
const LINEAR_NODES: DagNode[] = [
  { id: 'A', label: 'Alpha', edges: ['B'] },
  { id: 'B', label: 'Beta', edges: ['C'] },
  { id: 'C', label: 'Gamma' },
];

const ctx = createTestContext();

describe('dagPanePageDown / dagPanePageUp', () => {
  it('pages down', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 5, ctx });
    const next = dagPanePageDown(state);
    expect(next.focusArea.scroll.y).toBeGreaterThanOrEqual(0);
  });

  it('pages up', () => {
    let state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 5, ctx });
    state = dagPaneScrollBy(state, 10);
    const next = dagPanePageUp(state);
    expect(next.focusArea.scroll.y).toBeLessThan(state.focusArea.scroll.y);
  });
});
