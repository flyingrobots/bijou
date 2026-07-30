import {
  describe,
  expect,
  it,
} from 'vitest';
import { createTestContext } from '../../adapters/test/index.js';
import {
  dag,
  type DagNode,
} from './dag.js';

const withoutBadge: DagNode[] = [
  { id: 'a', label: 'Alpha' },
];
const withEmptyBadge: DagNode[] = [
  { id: 'a', label: 'Alpha', badge: '' },
];

describe('dag empty badges', () => {
  it.each([
    'pipe',
    'accessible',
    'interactive',
  ] as const)('treats an empty badge as absent in %s mode', (mode) => {
    const ctx = createTestContext({
      mode,
      runtime: { columns: 120 },
    });

    expect(dag(withEmptyBadge, { ctx })).toBe(
      dag(withoutBadge, { ctx }),
    );
  });

  it('treats an empty badge as absent in compact nodes', () => {
    const ctx = createTestContext({
      mode: 'interactive',
      runtime: { columns: 120 },
    });

    expect(dag(withEmptyBadge, { ctx, nodeStyle: 'compact' })).toBe(
      dag(withoutBadge, { ctx, nodeStyle: 'compact' }),
    );
  });
});
