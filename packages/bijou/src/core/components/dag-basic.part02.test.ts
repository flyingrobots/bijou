import { describe, it, expect } from 'vitest';
import { dag } from './dag.js';
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

const withBadges: DagNode[] = [
  { id: 'a', label: 'Build', edges: ['b'], badge: 'DONE' },
  { id: 'b', label: 'Test', edges: ['c'], badge: 'WIP' },
  { id: 'c', label: 'Deploy', badge: 'BLOCKED' },
];

describe('dag', () => {
  describe('CJK wide characters', () => {
      it('renders CJK label without corruption', () => {
        const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
        const nodes: DagNode[] = [
          { id: 'a', label: '漢字', edges: ['b'] },
          { id: 'b', label: 'Done' },
        ];
        const result = dag(nodes, { ctx });
        expect(result).toContain('漢字');
        expect(result).toContain('Done');
      });

      it('renders mixed ASCII + CJK label', () => {
        const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
        const nodes: DagNode[] = [
          { id: 'a', label: 'hi漢字!' },
        ];
        const result = dag(nodes, { ctx });
        expect(result).toContain('hi漢字!');
      });

      it('renders CJK badge correctly', () => {
        const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
        const nodes: DagNode[] = [
          { id: 'a', label: 'Task', badge: '完了' },
        ];
        const result = dag(nodes, { ctx });
        expect(result).toContain('Task');
        expect(result).toContain('完了');
      });
    });

  // ── Mode Tests ──────────────────────────────────────────────────

    describe('pipe mode', () => {
      it('renders adjacency list', () => {
        const ctx = createTestContext({ mode: 'pipe' });
        const result = dag(twoNodes, { ctx });
        expect(result).toContain('Alpha -> Beta');
        expect(result).toContain('Beta');
      });

      it('renders node with no edges as standalone', () => {
        const ctx = createTestContext({ mode: 'pipe' });
        const result = dag([{ id: 'a', label: 'Alone' }], { ctx });
        expect(result).toBe('Alone');
      });

      it('renders one pipe line per edge when a node fans out', () => {
        const ctx = createTestContext({ mode: 'pipe' });
        const result = dag(diamond, { ctx });
        expect(result.split('\n')).toEqual([
          'Start -> Left',
          'Start -> Right',
          'Left -> End',
          'Right -> End',
          'End',
        ]);
      });

      it('includes badges in parentheses', () => {
        const ctx = createTestContext({ mode: 'pipe' });
        const result = dag(withBadges, { ctx });
        expect(result).toContain('Build (DONE) -> Test');
        expect(result).toContain('Test (WIP) -> Deploy');
        expect(result).toContain('Deploy (BLOCKED)');
      });

      it('returns empty string for empty input', () => {
        const ctx = createTestContext({ mode: 'pipe' });
        expect(dag([], { ctx })).toBe('');
      });
    });
});
