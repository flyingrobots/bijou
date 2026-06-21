import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import type { DagNode } from '@flyingrobots/bijou';
import { createDagPaneState, dagPaneScrollBy } from './dag-pane.js';

// ── Test Data ──────────────────────────────────────────────────────

/** Simple linear chain: A → B → C */
const LINEAR_NODES: DagNode[] = [
  { id: 'A', label: 'Alpha', edges: ['B'] },
  { id: 'B', label: 'Beta', edges: ['C'] },
  { id: 'C', label: 'Gamma' },
];

const ctx = createTestContext();

// ── Scroll transformers ───────────────────────────────────────────

describe('dagPaneScrollBy', () => {
  it('scrolls viewport vertically', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 5, ctx });
    const next = dagPaneScrollBy(state, 2);
    expect(next.focusArea.scroll.y).toBe(2);
  });
});
