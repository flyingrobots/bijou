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

describe('DF-004 DOGFOOD coverage ratchet cycle', () => {
  it('creates an active cycle doc with the required workflow sections', () => {
    const cycle = read('/Users/james/git/bijou/docs/design/DF-004-raise-dogfood-coverage-floor-to-next-target.md');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('## Linked invariants');
    expect(cycle).toContain('## Implementation outline');
    expect(cycle).toContain('## Retrospective');
  });

  it('raises DOGFOOD coverage to five documented families and 14 percent', () => {
    const coverage = resolveDogfoodDocsCoverage(COMPONENT_STORIES);

    expect(coverage.documentedFamilies).toBe(5);
    expect(coverage.totalFamilies).toBe(35);
    expect(coverage.percent).toBe(14);
    expect(coverage.coveredFamilyIds).toContain('inline-status');
    expect(coverage.coveredFamilyIds).toContain('inline-shortcut-cues');
  });

  it('raises the enforced floor to 14 percent and the next target to 19 percent', () => {
    expect(DOGFOOD_COVERAGE_FLOOR_PERCENT).toBe(14);
    expect(DOGFOOD_COVERAGE_INCREMENT_PERCENT).toBe(5);
    expect(DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT).toBe(19);
  });

  it('spawns the next DOGFOOD backlog item', () => {
    expect(existsSync('/Users/james/git/bijou/docs/BACKLOG/DF-005-raise-dogfood-coverage-floor-to-19-percent.md')).toBe(true);
  });
});
