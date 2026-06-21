import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import type { DagNode } from '@flyingrobots/bijou';
import { createDagPaneState, dagPaneScrollBy, dagPaneScrollToTop, dagPaneScrollToBottom } from './dag-pane.js';

// ── Test Data ──────────────────────────────────────────────────────

/** Simple linear chain: A → B → C */
const LINEAR_NODES: DagNode[] = [
  { id: 'A', label: 'Alpha', edges: ['B'] },
  { id: 'B', label: 'Beta', edges: ['C'] },
  { id: 'C', label: 'Gamma' },
];

const ctx = createTestContext();

describe('dagPaneScrollToTop / dagPaneScrollToBottom', () => {
  it('scrolls to top', () => {
    let state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 5, ctx });
    state = dagPaneScrollBy(state, 5);
    const next = dagPaneScrollToTop(state);
    expect(next.focusArea.scroll.y).toBe(0);
  });

  it('scrolls to bottom', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 5, ctx });
    const next = dagPaneScrollToBottom(state);
    expect(next.focusArea.scroll.y).toBe(state.focusArea.scroll.maxY);
  });
});
