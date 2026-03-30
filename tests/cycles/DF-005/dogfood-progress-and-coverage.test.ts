import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  DOGFOOD_COVERAGE_FLOOR_PERCENT,
  DOGFOOD_COVERAGE_INCREMENT_PERCENT,
  DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT,
} from '../../../examples/docs/coverage-policy.js';
import { resolveDogfoodDocsCoverage } from '../../../examples/docs/coverage.js';
import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

describe('DF-005 DOGFOOD progress and coverage cycle', () => {
  it('creates an active cycle doc with the required workflow sections', () => {
    const cycle = read('/Users/james/git/bijou/docs/design/DF-005-raise-dogfood-coverage-floor-to-19-percent.md');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('## Linked invariants');
    expect(cycle).toContain('## Implementation outline');
    expect(cycle).toContain('## Retrospective');
  });

  it('raises DOGFOOD coverage to seven documented families and 20 percent', () => {
    const coverage = resolveDogfoodDocsCoverage(COMPONENT_STORIES);

    expect(coverage.documentedFamilies).toBe(7);
    expect(coverage.totalFamilies).toBe(35);
    expect(coverage.percent).toBe(20);
    expect(coverage.coveredFamilyIds).toContain('progress-indicators');
    expect(coverage.coveredFamilyIds).toContain('loading-placeholders');
  });

  it('adds real DOGFOOD stories for progress bars and loading placeholders', () => {
    expect(COMPONENT_STORIES.some((story) => story.id === 'progress-bar')).toBe(true);
    expect(COMPONENT_STORIES.some((story) => story.id === 'skeleton')).toBe(true);
  });

  it('raises the enforced floor to 19 percent and the next target to 24 percent', () => {
    expect(DOGFOOD_COVERAGE_FLOOR_PERCENT).toBe(19);
    expect(DOGFOOD_COVERAGE_INCREMENT_PERCENT).toBe(5);
    expect(DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT).toBe(24);
  });

  it('spawns the next DOGFOOD backlog item', () => {
    expect(existsSync('/Users/james/git/bijou/docs/BACKLOG/DF-006-raise-dogfood-coverage-floor-to-24-percent.md')).toBe(true);
  });
});
