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

describe('DF-007 DOGFOOD feedback and history coverage cycle', () => {
  it('creates an active cycle doc with the required workflow sections', () => {
    const cycle = read('/Users/james/git/bijou/docs/design/DF-007-raise-dogfood-coverage-floor-to-29-percent.md');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('## Linked invariants');
    expect(cycle).toContain('## Implementation outline');
    expect(cycle).toContain('## Retrospective');
  });

  it('raises DOGFOOD coverage to eleven documented families and 31 percent', () => {
    const coverage = resolveDogfoodDocsCoverage(COMPONENT_STORIES);

    expect(coverage.documentedFamilies).toBe(11);
    expect(coverage.totalFamilies).toBe(35);
    expect(coverage.percent).toBe(31);
    expect(coverage.coveredFamilyIds).toContain('low-level-transient-overlay');
    expect(coverage.coveredFamilyIds).toContain('activity-stream');
  });

  it('adds real DOGFOOD stories for low-level transient overlays and activity streams', () => {
    expect(COMPONENT_STORIES.some((story) => story.id === 'toast')).toBe(true);
    expect(COMPONENT_STORIES.some((story) => story.id === 'log')).toBe(true);
  });

  it('raises the enforced floor to 29 percent and the next target to 34 percent', () => {
    expect(DOGFOOD_COVERAGE_FLOOR_PERCENT).toBe(29);
    expect(DOGFOOD_COVERAGE_INCREMENT_PERCENT).toBe(5);
    expect(DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT).toBe(34);
  });

  it('spawns the next DOGFOOD backlog item', () => {
    expect(existsSync('/Users/james/git/bijou/docs/BACKLOG/DF-008-raise-dogfood-coverage-floor-to-34-percent.md')).toBe(true);
  });
});
