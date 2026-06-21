import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import type { DagNode } from '@flyingrobots/bijou';
import { createDagPaneState, dagPane } from './dag-pane.js';

// ── Test Data ──────────────────────────────────────────────────────

/** Simple linear chain: A → B → C */
const LINEAR_NODES: DagNode[] = [
  { id: 'A', label: 'Alpha', edges: ['B'] },
  { id: 'B', label: 'Beta', edges: ['C'] },
  { id: 'C', label: 'Gamma' },
];

const ctx = createTestContext();

// ── Render ─────────────────────────────────────────────────────────
describe('dagPane', () => {
  it('renders a string', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, ctx });
    const output = dagPane(state, { ctx });
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });
  it('renders exactly height lines', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 10, ctx });
    const output = dagPane(state, { ctx });
    expect(output.split('\n')).toHaveLength(10);
  });
  it('includes gutter in interactive mode', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 10, ctx });
    const output = dagPane(state, { ctx });
    expect(output).toContain('▎');
  });
  it('pipe mode omits gutter', () => {
    const pipeCtx = createTestContext({ mode: 'pipe' });
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 10, ctx: pipeCtx });
    const output = dagPane(state, { ctx: pipeCtx });
    expect(output).not.toContain('▎');
  });
});
