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

describe('DF-009 DOGFOOD form coverage cycle', () => {
  it('creates an active cycle doc with the required workflow sections', () => {
    const cycle = read('/Users/james/git/bijou/docs/design/DF-009-raise-dogfood-coverage-floor-to-39-percent.md');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('## Linked invariants');
    expect(cycle).toContain('## Implementation outline');
    expect(cycle).toContain('## Retrospective');
  });

  it('preserves the form families this ratchet added even after later coverage increases', () => {
    const coverage = resolveDogfoodDocsCoverage(COMPONENT_STORIES);

    expect(coverage.documentedFamilies).toBeGreaterThanOrEqual(15);
    expect(coverage.totalFamilies).toBe(35);
    expect(coverage.percent).toBeGreaterThanOrEqual(43);
    expect(coverage.coveredFamilyIds).toContain('multiple-choice');
    expect(coverage.coveredFamilyIds).toContain('binary-decision');
  });

  it('adds real DOGFOOD stories for confirm and multiselect', () => {
    expect(COMPONENT_STORIES.some((story) => story.id === 'confirm')).toBe(true);
    expect(COMPONENT_STORIES.some((story) => story.id === 'multiselect')).toBe(true);
  });

  it('keeps the ratchet moving upward in 5-point increments after this cycle', () => {
    expect(DOGFOOD_COVERAGE_FLOOR_PERCENT).toBeGreaterThanOrEqual(39);
    expect(DOGFOOD_COVERAGE_INCREMENT_PERCENT).toBe(5);
    expect(DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT).toBe(
      DOGFOOD_COVERAGE_FLOOR_PERCENT + DOGFOOD_COVERAGE_INCREMENT_PERCENT,
    );
  });

  it('spawns the next DOGFOOD backlog item', () => {
    expect(
      existsSync('/Users/james/git/bijou/docs/BACKLOG/DF-010-raise-dogfood-coverage-floor-to-44-percent.md') ||
      existsSync('/Users/james/git/bijou/docs/design/DF-010-raise-dogfood-coverage-floor-to-44-percent.md'),
    ).toBe(true);
  });
});
