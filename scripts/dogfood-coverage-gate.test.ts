import { describe, expect, it } from 'vitest';
import {
  DOGFOOD_COVERAGE_FLOOR_PERCENT,
  DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT,
  assertDogfoodCoverageFloor,
  evaluateDogfoodCoverageFloor,
} from '../examples/docs/coverage-policy.js';
import { resolveDogfoodDocsCoverage } from '../examples/docs/coverage.js';
import { COMPONENT_STORIES } from '../examples/docs/stories.js';
import { runDogfoodCoverageGate } from './dogfood-coverage-gate.js';

describe('dogfood coverage gate', () => {
  it('passes when current DOGFOOD coverage meets the explicit floor', () => {
    const coverage = resolveDogfoodDocsCoverage(COMPONENT_STORIES);
    const result = evaluateDogfoodCoverageFloor(coverage);

    expect(result.ok).toBe(true);
    expect(result.floorPercent).toBe(DOGFOOD_COVERAGE_FLOOR_PERCENT);
    expect(result.nextTargetPercent).toBe(DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT);
    expect(() => assertDogfoodCoverageFloor(coverage)).not.toThrow();
  });

  it('fails when the floor is set above current coverage', () => {
    const coverage = resolveDogfoodDocsCoverage(COMPONENT_STORIES);
    const tooHighFloor = coverage.percent + 1;

    const result = evaluateDogfoodCoverageFloor(coverage, { floorPercent: tooHighFloor });
    expect(result.ok).toBe(false);
    expect(() => assertDogfoodCoverageFloor(coverage, { floorPercent: tooHighFloor })).toThrow(
      /DOGFOOD documentation coverage floor not met/,
    );
  });

  it('prints a useful success summary when the floor is met', () => {
    const stdout: string[] = [];
    const stderr: string[] = [];

    const code = runDogfoodCoverageGate({
      stdout: (text) => stdout.push(text),
      stderr: (text) => stderr.push(text),
    });

    expect(code).toBe(0);
    expect(stderr).toEqual([]);
    expect(stdout.join('')).toContain('dogfood-coverage: ok');
    expect(stdout.join('')).toContain(`floor ${DOGFOOD_COVERAGE_FLOOR_PERCENT}%`);
    expect(stdout.join('')).toContain(`next target ${DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT}%`);
  });

  it('prints a useful failure summary when the floor is not met', () => {
    const stdout: string[] = [];
    const stderr: string[] = [];

    const code = runDogfoodCoverageGate({
      floorPercent: 100,
      stdout: (text) => stdout.push(text),
      stderr: (text) => stderr.push(text),
    });

    expect(code).toBe(1);
    expect(stdout).toEqual([]);
    expect(stderr.join('')).toContain('DOGFOOD documentation coverage floor not met');
    expect(stderr.join('')).toContain('floor 100%');
  });
});
