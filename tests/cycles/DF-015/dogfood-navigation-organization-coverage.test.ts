import { describe, expect, it } from 'vitest';
import { existsRepoPath, readRepoFile } from '../repo.js';
import {
  DOGFOOD_COVERAGE_FLOOR_PERCENT,
  DOGFOOD_COVERAGE_INCREMENT_PERCENT,
  DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT,
} from '../../../examples/docs/coverage-policy.js';
import { resolveDogfoodDocsCoverage } from '../../../examples/docs/coverage.js';
import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';


describe('DF-015 DOGFOOD navigation and organization coverage cycle', () => {
  it('creates an active cycle doc with the required workflow sections', () => {
    const cycle = readRepoFile('docs/design/DF-015-raise-dogfood-coverage-floor-to-69-percent.md');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('## Linked invariants');
    expect(cycle).toContain('## Implementation outline');
    expect(cycle).toContain('## Retrospective');
  });

  it('preserves progressive-disclosure and path/progress coverage', () => {
    const coverage = resolveDogfoodDocsCoverage(COMPONENT_STORIES);

    expect(coverage.documentedFamilies).toBeGreaterThanOrEqual(27);
    expect(coverage.totalFamilies).toBe(36);
    expect(coverage.percent).toBeGreaterThanOrEqual(77);
    expect(coverage.coveredFamilyIds).toContain('progressive-disclosure');
    expect(coverage.coveredFamilyIds).toContain('path-and-progress');
  });

  it('adds real DOGFOOD stories for disclosure and path/progress', () => {
    expect(COMPONENT_STORIES.some((story) => story.id === 'progressive-disclosure')).toBe(true);
    expect(COMPONENT_STORIES.some((story) => story.id === 'path-and-progress')).toBe(true);
  });

  it('moves the floor beyond 69 percent', () => {
    expect(DOGFOOD_COVERAGE_FLOOR_PERCENT).toBeGreaterThanOrEqual(69);
    expect(DOGFOOD_COVERAGE_INCREMENT_PERCENT).toBe(5);
    expect(DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT).toBeGreaterThanOrEqual(74);
  });

  it('spawns the next DOGFOOD cycle', () => {
    expect(
      existsRepoPath('docs/BACKLOG/DF-016-raise-dogfood-coverage-floor-to-74-percent.md') ||
      existsRepoPath('docs/design/DF-016-raise-dogfood-coverage-floor-to-74-percent.md'),
    ).toBe(true);
  });
});
