import { describe, expect, it } from 'vitest';
import { existsRepoPath, readRepoFile } from '../repo.js';
import {
  DOGFOOD_COVERAGE_FLOOR_PERCENT,
  DOGFOOD_COVERAGE_INCREMENT_PERCENT,
  DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT,
} from '../../../examples/docs/coverage-policy.js';
import { resolveDogfoodDocsCoverage } from '../../../examples/docs/coverage.js';
import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';


describe('DF-018 DOGFOOD branding and motion coverage cycle', () => {
  it('creates an active cycle doc with the required workflow sections', () => {
    const cycle = readRepoFile('docs/design/DF-018-raise-dogfood-coverage-floor-to-84-percent.md');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('## Linked invariants');
    expect(cycle).toContain('## Implementation outline');
    expect(cycle).toContain('## Retrospective');
  });

  it('preserves expressive-branding and motion/shader coverage', () => {
    const coverage = resolveDogfoodDocsCoverage(COMPONENT_STORIES);

    expect(coverage.documentedFamilies).toBeGreaterThanOrEqual(33);
    expect(coverage.totalFamilies).toBe(36);
    expect(coverage.percent).toBeGreaterThanOrEqual(94);
    expect(coverage.coveredFamilyIds).toContain('expressive-branding-and-decorative-emphasis');
    expect(coverage.coveredFamilyIds).toContain('motion-and-shader-effects');
  });

  it('adds real DOGFOOD stories for branding and shader/motion surfaces', () => {
    expect(COMPONENT_STORIES.some((story) => story.id === 'expressive-branding')).toBe(true);
    expect(COMPONENT_STORIES.some((story) => story.id === 'motion-and-shader-effects')).toBe(true);
  });

  it('moves the floor beyond 84 percent', () => {
    expect(DOGFOOD_COVERAGE_FLOOR_PERCENT).toBeGreaterThanOrEqual(84);
    expect(DOGFOOD_COVERAGE_INCREMENT_PERCENT).toBe(5);
    expect(DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT).toBeGreaterThanOrEqual(89);
  });

  it('spawns the final DOGFOOD completion cycle', () => {
    expect(
      existsRepoPath('docs/BACKLOG/DF-019-raise-dogfood-coverage-floor-to-100-percent.md') ||
      existsRepoPath('docs/design/DF-019-raise-dogfood-coverage-floor-to-100-percent.md'),
    ).toBe(true);
  });
});
