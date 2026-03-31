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

describe('DF-014 DOGFOOD shell and workspace coverage cycle', () => {
  it('creates an active cycle doc with the required workflow sections', () => {
    const cycle = read('/Users/james/git/bijou/docs/design/DF-014-raise-dogfood-coverage-floor-to-64-percent.md');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('## Linked invariants');
    expect(cycle).toContain('## Implementation outline');
    expect(cycle).toContain('## Retrospective');
  });

  it('preserves app-shell and workspace-layout coverage even after later ratchets', () => {
    const coverage = resolveDogfoodDocsCoverage(COMPONENT_STORIES);

    expect(coverage.documentedFamilies).toBeGreaterThanOrEqual(25);
    expect(coverage.totalFamilies).toBe(35);
    expect(coverage.percent).toBeGreaterThanOrEqual(71);
    expect(coverage.coveredFamilyIds).toContain('app-shell');
    expect(coverage.coveredFamilyIds).toContain('workspace-layout');
  });

  it('adds real DOGFOOD stories for shell chrome and workspace layout', () => {
    expect(COMPONENT_STORIES.some((story) => story.id === 'app-shell')).toBe(true);
    expect(COMPONENT_STORIES.some((story) => story.id === 'workspace-layout')).toBe(true);
  });

  it('moves the floor beyond 64 percent and keeps the ratchet saturated honestly', () => {
    expect(DOGFOOD_COVERAGE_FLOOR_PERCENT).toBeGreaterThanOrEqual(64);
    expect(DOGFOOD_COVERAGE_INCREMENT_PERCENT).toBe(5);
    expect(DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT).toBeGreaterThanOrEqual(69);
  });

  it('spawns the next DOGFOOD cycle', () => {
    expect(
      existsSync('/Users/james/git/bijou/docs/BACKLOG/DF-015-raise-dogfood-coverage-floor-to-69-percent.md') ||
      existsSync('/Users/james/git/bijou/docs/design/DF-015-raise-dogfood-coverage-floor-to-69-percent.md'),
    ).toBe(true);
  });
});
