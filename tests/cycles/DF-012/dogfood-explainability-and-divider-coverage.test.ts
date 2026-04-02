import { describe, expect, it } from 'vitest';
import { existsRepoPath, readRepoFile } from '../repo.js';
import {
  DOGFOOD_COVERAGE_FLOOR_PERCENT,
  DOGFOOD_COVERAGE_INCREMENT_PERCENT,
  DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT,
} from '../../../examples/docs/coverage-policy.js';
import { resolveDogfoodDocsCoverage } from '../../../examples/docs/coverage.js';
import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';


describe('DF-012 DOGFOOD explainability and divider coverage cycle', () => {
  it('creates an active cycle doc with the required workflow sections', () => {
    const cycle = readRepoFile('docs/design/DF-012-raise-dogfood-coverage-floor-to-54-percent.md');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('## Linked invariants');
    expect(cycle).toContain('## Implementation outline');
    expect(cycle).toContain('## Retrospective');
  });

  it('raises DOGFOOD coverage to twenty-one documented families and 60 percent', () => {
    const coverage = resolveDogfoodDocsCoverage(COMPONENT_STORIES);

    expect(coverage.documentedFamilies).toBeGreaterThanOrEqual(21);
    expect(coverage.totalFamilies).toBe(35);
    expect(coverage.percent).toBeGreaterThanOrEqual(60);
    expect(coverage.coveredFamilyIds).toContain('explainability-walkthroughs');
    expect(coverage.coveredFamilyIds).toContain('dividers');
  });

  it('adds real DOGFOOD stories for explainability and dividers', () => {
    expect(COMPONENT_STORIES.some((story) => story.id === 'explainability')).toBe(true);
    expect(COMPONENT_STORIES.some((story) => story.id === 'separator')).toBe(true);
  });

  it('raises the enforced floor to 54 percent and the next target to 59 percent', () => {
    expect(DOGFOOD_COVERAGE_FLOOR_PERCENT).toBeGreaterThanOrEqual(54);
    expect(DOGFOOD_COVERAGE_INCREMENT_PERCENT).toBe(5);
    expect(DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT).toBeGreaterThanOrEqual(59);
  });

  it('spawns the next DOGFOOD backlog item', () => {
    expect(
      existsRepoPath('docs/BACKLOG/DF-013-raise-dogfood-coverage-floor-to-59-percent.md') ||
      existsRepoPath('docs/design/DF-013-raise-dogfood-coverage-floor-to-59-percent.md'),
    ).toBe(true);
  });
});
