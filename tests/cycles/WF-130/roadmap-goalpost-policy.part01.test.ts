import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'vitest';
import {
  expectClaims,
  normalized,
  ROOT,
} from './roadmap-goalpost-policy.test-support.js';

describe('WF-130 roadmap goalpost policy', () => {
  it('documents release packets, goalposts, stories, slices, gates, and proof', () => {
    const releasePolicyPath = 'docs/method/releases/README.md';
    const releasePolicy = normalized(releasePolicyPath);

    if (!existsSync(resolve(ROOT, releasePolicyPath))) {
      throw new Error(`${releasePolicyPath} must exist`);
    }
    expectClaims(releasePolicy, [
      'Versioned Release',
      'Goalpost',
      'Umbrella Issue',
      'User Story Issue',
      'Slice Budget',
      'Release Gate',
      'Proof Policy',
      'vMAJOR.MINOR.PATCH',
      '`goalpost`',
      '`user-story`',
      'No implementation goalpost is complete through documentation alone.',
    ]);
  });
});
