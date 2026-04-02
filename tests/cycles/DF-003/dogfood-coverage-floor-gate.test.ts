import { describe, expect, it } from 'vitest';
import { existsRepoPath, readRepoFile } from '../repo.js';
import {
  DOGFOOD_COVERAGE_FLOOR_PERCENT,
  DOGFOOD_COVERAGE_INCREMENT_PERCENT,
  DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT,
} from '../../../examples/docs/coverage-policy.js';
import { resolveDogfoodDocsCoverage } from '../../../examples/docs/coverage.js';
import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';


describe('DF-003 DOGFOOD coverage floor gate cycle', () => {
  it('creates an active cycle doc with the required workflow sections', () => {
    const cycle = readRepoFile('docs/design/DF-003-enforce-dogfood-coverage-floor.md');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('## Linked invariants');
    expect(cycle).toContain('## Implementation outline');
    expect(cycle).toContain('## Retrospective');
  });

  it('tracks the current floor and next target explicitly', () => {
    const coverage = resolveDogfoodDocsCoverage(COMPONENT_STORIES);

    expect(coverage.percent).toBeGreaterThanOrEqual(DOGFOOD_COVERAGE_FLOOR_PERCENT);
    expect(DOGFOOD_COVERAGE_INCREMENT_PERCENT).toBe(5);
    expect(DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT).toBe(
      Math.min(100, DOGFOOD_COVERAGE_FLOOR_PERCENT + DOGFOOD_COVERAGE_INCREMENT_PERCENT),
    );
  });

  it('spawns the next DOGFOOD backlog item', () => {
    const cycle = readRepoFile('docs/design/DF-003-enforce-dogfood-coverage-floor.md');

    expect(cycle).toContain('[DF-004 — Raise DOGFOOD Coverage Floor to the Next 5-Point Target]');
    expect(
      existsRepoPath('docs/BACKLOG/DF-004-raise-dogfood-coverage-floor-to-next-target.md') ||
      existsRepoPath('docs/design/DF-004-raise-dogfood-coverage-floor-to-next-target.md'),
    ).toBe(true);
  });
});
