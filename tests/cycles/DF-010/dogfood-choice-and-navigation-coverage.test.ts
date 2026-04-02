import { describe, expect, it } from 'vitest';
import { existsRepoPath, readRepoFile } from '../repo.js';
import {
  DOGFOOD_COVERAGE_FLOOR_PERCENT,
  DOGFOOD_COVERAGE_INCREMENT_PERCENT,
  DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT,
} from '../../../examples/docs/coverage-policy.js';
import { resolveDogfoodDocsCoverage } from '../../../examples/docs/coverage.js';
import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';


describe('DF-010 DOGFOOD choice and navigation coverage cycle', () => {
  it('creates an active cycle doc with the required workflow sections', () => {
    const cycle = readRepoFile('docs/design/DF-010-raise-dogfood-coverage-floor-to-44-percent.md');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('## Linked invariants');
    expect(cycle).toContain('## Implementation outline');
    expect(cycle).toContain('## Retrospective');
  });

  it('preserves at least the DF-010 coverage floor and family additions', () => {
    const coverage = resolveDogfoodDocsCoverage(COMPONENT_STORIES);

    expect(coverage.documentedFamilies).toBeGreaterThanOrEqual(17);
    expect(coverage.totalFamilies).toBe(35);
    expect(coverage.percent).toBeGreaterThanOrEqual(49);
    expect(coverage.coveredFamilyIds).toContain('single-choice');
    expect(coverage.coveredFamilyIds).toContain('peer-navigation');
  });

  it('adds real DOGFOOD stories for single choice and peer navigation', () => {
    expect(COMPONENT_STORIES.some((story) => story.id === 'select')).toBe(true);
    expect(COMPONENT_STORIES.some((story) => story.id === 'tabs')).toBe(true);
  });

  it('preserves at least the DF-010 floor ratchet', () => {
    expect(DOGFOOD_COVERAGE_FLOOR_PERCENT).toBeGreaterThanOrEqual(44);
    expect(DOGFOOD_COVERAGE_INCREMENT_PERCENT).toBe(5);
    expect(DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT).toBeGreaterThanOrEqual(49);
  });

  it('spawns the next DOGFOOD backlog item', () => {
    expect(
      existsRepoPath('docs/BACKLOG/DF-011-raise-dogfood-coverage-floor-to-49-percent.md')
      || existsRepoPath('docs/design/DF-011-raise-dogfood-coverage-floor-to-49-percent.md'),
    ).toBe(true);
  });
});
