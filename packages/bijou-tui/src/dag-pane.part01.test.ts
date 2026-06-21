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

const ctx = createTestContext();

// ── createDagPaneState ────────────────────────────────────────────

describe('createDagPaneState', () => {
  it('creates state with no selection', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, ctx });
    expect(state.selectedId).toBeUndefined();
    expect(state.highlightPath).toEqual([]);
  });

  it('caches layout', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, ctx });
    expect(state.layout.output).toBeTruthy();
    expect(state.layout.nodes.size).toBe(3);
  });

  it('creates focusArea state', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, ctx });
    expect(state.focusArea.width).toBe(60);
    expect(state.focusArea.height).toBe(20);
  });

  it('allows initial selectedId', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, selectedId: 'B', ctx });
    expect(state.selectedId).toBe('B');
    expect(state.highlightPath.length).toBeGreaterThan(0);
  });

  it('defaults overflowX to scroll (DAGs are wide)', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, ctx });
    expect(state.focusArea.overflowX).toBe('scroll');
  });

  it('stores source reference', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, ctx });
    expect(state.source).toBe(LINEAR_NODES);
  });
});
