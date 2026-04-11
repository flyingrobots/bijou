import { describe, expect, it } from 'vitest';
import { existsRepoPath, readRepoFile } from '../repo.js';
import {
  DOGFOOD_COVERAGE_FLOOR_PERCENT,
  DOGFOOD_COVERAGE_INCREMENT_PERCENT,
  DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT,
} from '../../../examples/docs/coverage-policy.js';
import { resolveDogfoodDocsCoverage } from '../../../examples/docs/coverage.js';
import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';


describe('DF-011 DOGFOOD text-entry and staged-form coverage cycle', () => {
  it('creates an active cycle doc with the required workflow sections', () => {
    const cycle = readRepoFile('docs/design/DF-011-raise-dogfood-coverage-floor-to-49-percent.md');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('## Linked invariants');
    expect(cycle).toContain('## Implementation outline');
    expect(cycle).toContain('## Retrospective');
  });

  it('raises DOGFOOD coverage to nineteen documented families and 54 percent', () => {
    const coverage = resolveDogfoodDocsCoverage(COMPONENT_STORIES);

    expect(coverage.documentedFamilies).toBeGreaterThanOrEqual(19);
    expect(coverage.totalFamilies).toBe(36);
    expect(coverage.percent).toBeGreaterThanOrEqual(54);
    expect(coverage.coveredFamilyIds).toContain('text-entry');
    expect(coverage.coveredFamilyIds).toContain('multi-field-and-staged-forms');
  });

  it('adds real DOGFOOD stories for text entry and grouped or staged forms', () => {
    expect(COMPONENT_STORIES.some((story) => story.id === 'text-entry')).toBe(true);
    expect(COMPONENT_STORIES.some((story) => story.id === 'group-wizard')).toBe(true);
  });

  it('raises the enforced floor to 49 percent and the next target to 54 percent', () => {
    expect(DOGFOOD_COVERAGE_FLOOR_PERCENT).toBeGreaterThanOrEqual(49);
    expect(DOGFOOD_COVERAGE_INCREMENT_PERCENT).toBe(5);
    expect(DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT).toBeGreaterThanOrEqual(54);
  });

  it('spawns the next DOGFOOD backlog item', () => {
    expect(
      existsRepoPath('docs/BACKLOG/DF-012-raise-dogfood-coverage-floor-to-54-percent.md') ||
      existsRepoPath('docs/design/DF-012-raise-dogfood-coverage-floor-to-54-percent.md'),
    ).toBe(true);
  });
});
