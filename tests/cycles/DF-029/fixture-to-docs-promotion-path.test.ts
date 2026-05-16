import { describe, expect, it } from 'vitest';
import { readRepoFile } from '../repo.js';

describe('DF-029 fixture-to-docs promotion path cycle', () => {
  it('keeps the active cycle doc tied to the playback contract', () => {
    const cycle = readRepoFile('docs/design/DF-029-fixture-to-docs-promotion-path.md');

    expect(cycle).toContain('## Sponsored Users');
    expect(cycle).toContain('## Hills');
    expect(cycle).toContain('## Playback Questions');
    expect(cycle).toContain('## Requirements');
    expect(cycle).toContain('## Acceptance Criteria');
    expect(cycle).toContain('## Drift Check');
    expect(cycle).toContain('## Playback');
    expect(cycle).toContain('## Retrospective');
  });

  it('exports fixture promotion helpers from the bijou root barrel', () => {
    const rootBarrel = readRepoFile('packages/bijou/src/index.ts');

    expect(rootBarrel).toContain('createFixturePromotionRecord');
    expect(rootBarrel).toContain('reverseFixturePromotionRecord');
    expect(rootBarrel).toContain('FixturePromotionRecord');
  });
});
