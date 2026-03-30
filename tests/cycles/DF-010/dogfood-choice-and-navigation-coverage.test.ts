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

describe('DF-010 DOGFOOD choice and navigation coverage cycle', () => {
  it('creates an active cycle doc with the required workflow sections', () => {
    const cycle = read('/Users/james/git/bijou/docs/design/DF-010-raise-dogfood-coverage-floor-to-44-percent.md');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('## Linked invariants');
    expect(cycle).toContain('## Implementation outline');
    expect(cycle).toContain('## Retrospective');
  });

  it('raises DOGFOOD coverage to seventeen documented families and 49 percent', () => {
    const coverage = resolveDogfoodDocsCoverage(COMPONENT_STORIES);

    expect(coverage.documentedFamilies).toBe(17);
    expect(coverage.totalFamilies).toBe(35);
    expect(coverage.percent).toBe(49);
    expect(coverage.coveredFamilyIds).toContain('single-choice');
    expect(coverage.coveredFamilyIds).toContain('peer-navigation');
  });

  it('adds real DOGFOOD stories for single choice and peer navigation', () => {
    expect(COMPONENT_STORIES.some((story) => story.id === 'select')).toBe(true);
    expect(COMPONENT_STORIES.some((story) => story.id === 'tabs')).toBe(true);
  });

  it('raises the enforced floor to 44 percent and the next target to 49 percent', () => {
    expect(DOGFOOD_COVERAGE_FLOOR_PERCENT).toBe(44);
    expect(DOGFOOD_COVERAGE_INCREMENT_PERCENT).toBe(5);
    expect(DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT).toBe(49);
  });

  it('spawns the next DOGFOOD backlog item', () => {
    expect(existsSync('/Users/james/git/bijou/docs/BACKLOG/DF-011-raise-dogfood-coverage-floor-to-49-percent.md')).toBe(true);
  });
});
