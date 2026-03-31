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

describe('DF-013 DOGFOOD shell help and notification coverage cycle', () => {
  it('creates an active cycle doc with the required workflow sections', () => {
    const cycle = read('/Users/james/git/bijou/docs/design/DF-013-raise-dogfood-coverage-floor-to-59-percent.md');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('## Linked invariants');
    expect(cycle).toContain('## Implementation outline');
    expect(cycle).toContain('## Retrospective');
  });

  it('raises DOGFOOD coverage to twenty-three documented families and 66 percent', () => {
    const coverage = resolveDogfoodDocsCoverage(COMPONENT_STORIES);

    expect(coverage.documentedFamilies).toBe(23);
    expect(coverage.totalFamilies).toBe(35);
    expect(coverage.percent).toBe(66);
    expect(coverage.coveredFamilyIds).toContain('keybinding-help-and-shell-hints');
    expect(coverage.coveredFamilyIds).toContain('notification-system');
  });

  it('adds real DOGFOOD stories for help and the notification system', () => {
    expect(COMPONENT_STORIES.some((story) => story.id === 'help-view')).toBe(true);
    expect(COMPONENT_STORIES.some((story) => story.id === 'notification-system')).toBe(true);
  });

  it('raises the enforced floor to 59 percent and the next target to 64 percent', () => {
    expect(DOGFOOD_COVERAGE_FLOOR_PERCENT).toBe(59);
    expect(DOGFOOD_COVERAGE_INCREMENT_PERCENT).toBe(5);
    expect(DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT).toBe(64);
  });

  it('spawns the next DOGFOOD backlog item', () => {
    expect(existsSync('/Users/james/git/bijou/docs/BACKLOG/DF-014-raise-dogfood-coverage-floor-to-64-percent.md')).toBe(true);
  });
});
