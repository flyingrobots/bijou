import { describe, expect, it } from 'vitest';
import { existsRepoPath, readRepoFile } from '../repo.js';
import {
  DOGFOOD_COVERAGE_FLOOR_PERCENT,
  DOGFOOD_COVERAGE_INCREMENT_PERCENT,
  DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT,
} from '../../../examples/docs/coverage-policy.js';
import { resolveDogfoodDocsCoverage } from '../../../examples/docs/coverage.js';
import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';


describe('DF-005 DOGFOOD progress and coverage cycle', () => {
  it('creates an active cycle doc with the required workflow sections', () => {
    const cycle = readRepoFile('docs/design/DF-005-raise-dogfood-coverage-floor-to-19-percent.md');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('## Linked invariants');
    expect(cycle).toContain('## Implementation outline');
    expect(cycle).toContain('## Retrospective');
  });

  it('preserves the progress and loading families this ratchet added even after later coverage increases', () => {
    const coverage = resolveDogfoodDocsCoverage(COMPONENT_STORIES);

    expect(coverage.documentedFamilies).toBeGreaterThanOrEqual(7);
    expect(coverage.totalFamilies).toBe(36);
    expect(coverage.percent).toBeGreaterThanOrEqual(20);
    expect(coverage.coveredFamilyIds).toContain('progress-indicators');
    expect(coverage.coveredFamilyIds).toContain('loading-placeholders');
  });

  it('adds real DOGFOOD stories for progress bars and loading placeholders', () => {
    expect(COMPONENT_STORIES.some((story) => story.id === 'progress-bar')).toBe(true);
    expect(COMPONENT_STORIES.some((story) => story.id === 'skeleton')).toBe(true);
  });

  it('keeps the ratchet moving upward in 5-point increments after this cycle', () => {
    expect(DOGFOOD_COVERAGE_FLOOR_PERCENT).toBeGreaterThanOrEqual(19);
    expect(DOGFOOD_COVERAGE_INCREMENT_PERCENT).toBe(5);
    expect(DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT).toBe(
      Math.min(100, DOGFOOD_COVERAGE_FLOOR_PERCENT + DOGFOOD_COVERAGE_INCREMENT_PERCENT),
    );
  });

  it('spawns the next DOGFOOD backlog item', () => {
    expect(
      existsRepoPath('docs/BACKLOG/DF-006-raise-dogfood-coverage-floor-to-24-percent.md') ||
      existsRepoPath('docs/design/DF-006-raise-dogfood-coverage-floor-to-24-percent.md'),
    ).toBe(true);
  });
});
