import { describe, expect, it } from 'vitest';
import { existsRepoPath, readRepoFile } from '../repo.js';
import {
  DOGFOOD_COVERAGE_FLOOR_PERCENT,
  DOGFOOD_COVERAGE_INCREMENT_PERCENT,
  DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT,
} from '../../../examples/docs/coverage-policy.js';
import { resolveDogfoodDocsCoverage } from '../../../examples/docs/coverage.js';
import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';


describe('DF-016 DOGFOOD data comparison and list coverage cycle', () => {
  it('creates an active cycle doc with the required workflow sections', () => {
    const cycle = readRepoFile('docs/design/DF-016-raise-dogfood-coverage-floor-to-74-percent.md');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('## Linked invariants');
    expect(cycle).toContain('## Implementation outline');
    expect(cycle).toContain('## Retrospective');
  });

  it('preserves dense-comparison and exploration-list coverage', () => {
    const coverage = resolveDogfoodDocsCoverage(COMPONENT_STORIES);

    expect(coverage.documentedFamilies).toBeGreaterThanOrEqual(29);
    expect(coverage.totalFamilies).toBe(36);
    expect(coverage.percent).toBeGreaterThanOrEqual(83);
    expect(coverage.coveredFamilyIds).toContain('dense-comparison');
    expect(coverage.coveredFamilyIds).toContain('lists-for-exploration');
  });

  it('adds real DOGFOOD stories for comparison and exploration lists', () => {
    expect(COMPONENT_STORIES.some((story) => story.id === 'dense-comparison')).toBe(true);
    expect(COMPONENT_STORIES.some((story) => story.id === 'lists-for-exploration')).toBe(true);
  });

  it('moves the floor beyond 74 percent', () => {
    expect(DOGFOOD_COVERAGE_FLOOR_PERCENT).toBeGreaterThanOrEqual(74);
    expect(DOGFOOD_COVERAGE_INCREMENT_PERCENT).toBe(5);
    expect(DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT).toBeGreaterThanOrEqual(79);
  });

  it('spawns the next DOGFOOD cycle', () => {
    expect(
      existsRepoPath('docs/BACKLOG/DF-017-raise-dogfood-coverage-floor-to-79-percent.md') ||
      existsRepoPath('docs/design/DF-017-raise-dogfood-coverage-floor-to-79-percent.md'),
    ).toBe(true);
  });
});
