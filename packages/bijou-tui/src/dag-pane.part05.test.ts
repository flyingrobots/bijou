import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
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

// ── Direct selection ──────────────────────────────────────────────

describe('dagPaneSelectNode', () => {
  it('selects a specific node by ID', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, ctx });
    const next = dagPaneSelectNode(state, 'C', ctx);
    expect(next.selectedId).toBe('C');
  });

  it('computes highlight path to root', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, ctx });
    const next = dagPaneSelectNode(state, 'C', ctx);
    expect(next.highlightPath).toContain('A');
    expect(next.highlightPath).toContain('B');
    expect(next.highlightPath).toContain('C');
  });

  it('ignores unknown node IDs', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, ctx });
    const next = dagPaneSelectNode(state, 'UNKNOWN', ctx);
    expect(next.selectedId).toBeUndefined();
  });

  it('preserves existing selection when ID is unknown', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, selectedId: 'B', ctx });
    const next = dagPaneSelectNode(state, 'UNKNOWN', ctx);
    expect(next.selectedId).toBe('B');
  });
});
