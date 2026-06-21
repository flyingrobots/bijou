import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import type { DagNode } from '@flyingrobots/bijou';
import { createDagPaneState } from './dag-pane.js';

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

// ── Auto-highlight path ───────────────────────────────────────────

describe('auto-highlight path', () => {
  it('path includes root to selected node in linear chain', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, selectedId: 'C', ctx });
    expect(state.highlightPath).toEqual(['A', 'B', 'C']);
  });

  it('path is single node for root selection', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, selectedId: 'A', ctx });
    expect(state.highlightPath).toEqual(['A']);
  });

  it('path follows one branch in diamond graph', () => {
    const state = createDagPaneState({ source: DIAMOND_NODES, width: 80, height: 20, selectedId: 'D', ctx });
    // Should find a path from A through either B or C to D
    expect(state.highlightPath[0]).toBe('A');
    expect(state.highlightPath[state.highlightPath.length - 1]).toBe('D');
    expect(state.highlightPath.length).toBe(3); // A → B|C → D
  });

  it('empty path when no selection', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, ctx });
    expect(state.highlightPath).toEqual([]);
  });
});
