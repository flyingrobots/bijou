import { describe, expect, it } from 'vitest';
import { existsRepoPath, readRepoFile } from '../repo.js';
import {
  DOGFOOD_COVERAGE_FLOOR_PERCENT,
  DOGFOOD_COVERAGE_INCREMENT_PERCENT,
  DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT,
} from '../../../examples/docs/coverage-policy.js';
import { resolveDogfoodDocsCoverage } from '../../../examples/docs/coverage.js';
import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';


describe('DF-017 DOGFOOD hierarchy and time/dependency coverage cycle', () => {
  it('creates an active cycle doc with the required workflow sections', () => {
    const cycle = readRepoFile('docs/design/DF-017-raise-dogfood-coverage-floor-to-79-percent.md');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('## Linked invariants');
    expect(cycle).toContain('## Implementation outline');
    expect(cycle).toContain('## Retrospective');
  });

  it('preserves hierarchy and temporal/dependency coverage', () => {
    const coverage = resolveDogfoodDocsCoverage(COMPONENT_STORIES);

    expect(coverage.documentedFamilies).toBeGreaterThanOrEqual(31);
    expect(coverage.totalFamilies).toBe(35);
    expect(coverage.percent).toBeGreaterThanOrEqual(89);
    expect(coverage.coveredFamilyIds).toContain('hierarchy');
    expect(coverage.coveredFamilyIds).toContain('temporal-or-dependency-views');
  });

  it('adds real DOGFOOD stories for hierarchy and time/dependency structure', () => {
    expect(COMPONENT_STORIES.some((story) => story.id === 'hierarchy')).toBe(true);
    expect(COMPONENT_STORIES.some((story) => story.id === 'temporal-or-dependency-views')).toBe(true);
  });

  it('moves the floor beyond 79 percent', () => {
    expect(DOGFOOD_COVERAGE_FLOOR_PERCENT).toBeGreaterThanOrEqual(79);
    expect(DOGFOOD_COVERAGE_INCREMENT_PERCENT).toBe(5);
    expect(DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT).toBeGreaterThanOrEqual(84);
  });

  it('spawns the next DOGFOOD cycle', () => {
    expect(
      existsRepoPath('docs/BACKLOG/DF-018-raise-dogfood-coverage-floor-to-84-percent.md') ||
      existsRepoPath('docs/design/DF-018-raise-dogfood-coverage-floor-to-84-percent.md'),
    ).toBe(true);
  });
});
