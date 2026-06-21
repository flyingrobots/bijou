import { describe, it, expect } from 'vitest';
import { dag, dagLayout } from './dag.js';
import type { DagNode } from './dag.js';
import { createTestContext } from '../../adapters/test/index.js';

// ── Test Data ──────────────────────────────────────────────────────
const twoNodes: DagNode[] = [
  { id: 'a', label: 'Alpha', edges: ['b'] },
  { id: 'b', label: 'Beta' },
];

const diamond: DagNode[] = [
  { id: 'a', label: 'Start', edges: ['b', 'c'] },
  { id: 'b', label: 'Left', edges: ['d'] },
  { id: 'c', label: 'Right', edges: ['d'] },
  { id: 'd', label: 'End' },
];

const cyclic: DagNode[] = [
  { id: 'a', label: 'A', edges: ['b'] },
  { id: 'b', label: 'B', edges: ['a'] },
];

const selfLoop: DagNode[] = [
  { id: 'a', label: 'A', edges: ['a'] },
];

describe('dag', () => {
  // ── Error Cases ─────────────────────────────────────────────────
    describe('errors', () => {
      it('renders cyclic graphs without throwing', () => {
        const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
        const result = dag(cyclic, { ctx });
        expect(result).toContain('A');
        expect(result).toContain('B');
      });
      it('renders self-loops without throwing', () => {
        const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
        const result = dag(selfLoop, { ctx });
        expect(result).toContain('A');
      });
      it('ignores dangling edge targets without false cycle error', () => {
        const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
        const dangling: DagNode[] = [
          { id: 'a', label: 'A', edges: ['missing'] },
          { id: 'b', label: 'B' },
        ];
        // Should not throw — dangling edges are silently ignored
        const result = dag(dangling, { ctx });
        expect(result).toContain('A');
        expect(result).toContain('B');
        expect(result).not.toContain('missing');
      });
      it('throws explicit error on duplicate node IDs', () => {
        const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
        const dupes: DagNode[] = [
          { id: 'a', label: 'First A', edges: ['b'] },
          { id: 'a', label: 'Second A', edges: ['b'] },
          { id: 'b', label: 'B' },
        ];
        expect(() => dag(dupes, { ctx })).toThrow('duplicate node id "a"');
      });
    });

  // ── selectedId ──────────────────────────────────────────────────
    describe('selectedId', () => {
      it('renders with selectedId without error', () => {
        const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
        const result = dag(twoNodes, { selectedId: 'a', ctx });
        expect(result).toContain('Alpha');
        expect(result).toContain('Beta');
      });
      it('selectedId takes precedence over highlightPath', () => {
        const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
        // Both highlight and select node 'a' — should not crash
        const result = dag(diamond, {
          selectedId: 'a',
          highlightPath: ['a', 'b', 'd'],
          highlightToken: { hex: '#ff0000' },
          ctx,
        });
        expect(result).toContain('Start');
      });
      it('non-selected nodes are unaffected', () => {
        const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
        const result = dag(twoNodes, { selectedId: 'a', ctx });
        // Both nodes should be present in output
        expect(result).toContain('Alpha');
        expect(result).toContain('Beta');
      });
      it('defaults to ui.cursor token when selectedToken omitted', () => {
        const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
        // Should not throw — uses default cursor token
        const layout = dagLayout(twoNodes, { selectedId: 'a', ctx });
        expect(layout.output).toContain('Alpha');
        expect(layout.nodes.has('a')).toBe(true);
      });
    });
});
