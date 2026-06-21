import { describe, it, expect } from 'vitest';
import { createTestContext, must } from '@flyingrobots/bijou/adapters/test';
import type { DagNode } from '@flyingrobots/bijou';
import { createDagPaneState, dagPaneSelectNode } from './dag-pane.js';

// ── Test Data ──────────────────────────────────────────────────────

/** Simple linear chain: A → B → C */
const LINEAR_NODES: DagNode[] = [
  { id: 'A', label: 'Alpha', edges: ['B'] },
  { id: 'B', label: 'Beta', edges: ['C'] },
  { id: 'C', label: 'Gamma' },
];

const ctx = createTestContext();

// ── Auto-scroll to selection ──────────────────────────────────────
describe('auto-scroll to selection', () => {
  it('scrolls to bring selected node into view', () => {
    // Use a small viewport height to ensure the last node in a tall graph
    // is outside the initial viewport
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 5, ctx });
    const next = dagPaneSelectNode(state, 'C', ctx);
    // The node C is in the last layer, which starts well below row 0
    const nodePos = next.layout.nodes.get('C');
    expect(nodePos).toBeDefined();
    // Scroll should have adjusted so the node is within the viewport
    const scrollY = next.focusArea.scroll.y;
    expect(scrollY).toBeLessThanOrEqual(must(nodePos).row);
    expect(scrollY + next.focusArea.height).toBeGreaterThanOrEqual(must(nodePos).row);
  });
});
