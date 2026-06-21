import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import type { DagNode } from '@flyingrobots/bijou';
import { createDagPaneState, dagPaneScrollByX } from './dag-pane.js';

/** Wide graph with multiple roots and siblings in same layer */
const WIDE_NODES: DagNode[] = [
  { id: 'R1', label: 'Root 1', edges: ['C1', 'C2'] },
  { id: 'R2', label: 'Root 2', edges: ['C3'] },
  { id: 'C1', label: 'Child 1' },
  { id: 'C2', label: 'Child 2' },
  { id: 'C3', label: 'Child 3' },
];

const ctx = createTestContext();

describe('dagPaneScrollByX', () => {
  it('scrolls horizontally', () => {
    const state = createDagPaneState({ source: WIDE_NODES, width: 40, height: 20, ctx });
    const next = dagPaneScrollByX(state, 5);
    expect(next.focusArea.scroll.x).toBe(5);
  });
});
