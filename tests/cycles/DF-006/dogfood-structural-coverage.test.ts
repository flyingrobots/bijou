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

describe('DF-006 DOGFOOD structural coverage cycle', () => {
  it('creates an active cycle doc with the required workflow sections', () => {
    const cycle = read('/Users/james/git/bijou/docs/design/DF-006-raise-dogfood-coverage-floor-to-24-percent.md');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('## Linked invariants');
    expect(cycle).toContain('## Implementation outline');
    expect(cycle).toContain('## Retrospective');
  });

  it('preserves the structural families this ratchet added even after later coverage increases', () => {
    const coverage = resolveDogfoodDocsCoverage(COMPONENT_STORIES);

    expect(coverage.documentedFamilies).toBeGreaterThanOrEqual(9);
    expect(coverage.totalFamilies).toBe(35);
    expect(coverage.percent).toBeGreaterThanOrEqual(26);
    expect(coverage.coveredFamilyIds).toContain('framed-grouping');
    expect(coverage.coveredFamilyIds).toContain('inspector-panels');
  });

  it('adds real DOGFOOD stories for structural grouping and inspector panels', () => {
    expect(COMPONENT_STORIES.some((story) => story.id === 'box')).toBe(true);
    expect(COMPONENT_STORIES.some((story) => story.id === 'inspector')).toBe(true);
  });

  it('keeps the ratchet moving upward in 5-point increments after this cycle', () => {
    expect(DOGFOOD_COVERAGE_FLOOR_PERCENT).toBeGreaterThanOrEqual(24);
    expect(DOGFOOD_COVERAGE_INCREMENT_PERCENT).toBe(5);
    expect(DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT).toBe(
      Math.min(100, DOGFOOD_COVERAGE_FLOOR_PERCENT + DOGFOOD_COVERAGE_INCREMENT_PERCENT),
    );
  });

  it('spawns the next DOGFOOD backlog item', () => {
    expect(
      existsSync('/Users/james/git/bijou/docs/BACKLOG/DF-007-raise-dogfood-coverage-floor-to-29-percent.md') ||
      existsSync('/Users/james/git/bijou/docs/design/DF-007-raise-dogfood-coverage-floor-to-29-percent.md'),
    ).toBe(true);
  });
});
