import { describe, expect, it } from 'vitest';
import { listExampleTargets } from './smoke-all-examples-lib.js';

describe('listExampleTargets', () => {
  it('sorts discovered examples deterministically', () => {
    const targets = listExampleTargets('/repo', () => 'examples/zeta/main.ts\nexamples/alpha/main.ts\n');

    expect(targets).toEqual([
      'examples/alpha/main.ts',
      'examples/zeta/main.ts',
    ]);
  });
});
