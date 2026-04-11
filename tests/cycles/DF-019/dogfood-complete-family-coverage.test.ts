import { describe, expect, it } from 'vitest';
import { existsRepoPath, readRepoFile } from '../repo.js';
import {
  DOGFOOD_COVERAGE_FLOOR_PERCENT,
  DOGFOOD_COVERAGE_INCREMENT_PERCENT,
  DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT,
} from '../../../examples/docs/coverage-policy.js';
import { resolveDogfoodDocsCoverage } from '../../../examples/docs/coverage.js';
import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';


describe('DF-019 DOGFOOD complete family coverage cycle', () => {
  it('creates an active cycle doc with the required workflow sections', () => {
    const cycle = readRepoFile('docs/design/DF-019-raise-dogfood-coverage-floor-to-100-percent.md');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('## Linked invariants');
    expect(cycle).toContain('## Implementation outline');
    expect(cycle).toContain('## Retrospective');
  });

  it('completes DOGFOOD component-family coverage', () => {
    const coverage = resolveDogfoodDocsCoverage(COMPONENT_STORIES);

    expect(coverage.documentedFamilies).toBe(36);
    expect(coverage.totalFamilies).toBe(36);
    expect(coverage.percent).toBe(100);
    expect(coverage.coveredFamilyIds).toContain('transient-app-notifications');
    expect(coverage.coveredFamilyIds).toContain('mode-aware-custom-primitives');
  });

  it('adds the final real DOGFOOD stories needed to cover every family', () => {
    expect(COMPONENT_STORIES.some((story) => story.id === 'transient-app-notifications')).toBe(true);
    expect(COMPONENT_STORIES.some((story) => story.id === 'mode-aware-custom-primitives')).toBe(true);
  });

  it('saturates the coverage floor and next target at 100 percent', () => {
    expect(DOGFOOD_COVERAGE_FLOOR_PERCENT).toBe(100);
    expect(DOGFOOD_COVERAGE_INCREMENT_PERCENT).toBe(5);
    expect(DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT).toBe(100);
  });

  it('spawns the next non-ratchet DOGFOOD backlog item', () => {
    expect(existsRepoPath('docs/BACKLOG/up-next/DF-020-deepen-dogfood-story-depth-and-variant-quality.md')).toBe(true);
  });
});
