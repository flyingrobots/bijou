import type { DogfoodDocsCoverage } from './coverage.js';

export const DOGFOOD_COVERAGE_FLOOR_PERCENT = 29;
export const DOGFOOD_COVERAGE_INCREMENT_PERCENT = 5;
export const DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT =
  DOGFOOD_COVERAGE_FLOOR_PERCENT + DOGFOOD_COVERAGE_INCREMENT_PERCENT;

export interface DogfoodCoverageFloorOptions {
  readonly floorPercent?: number;
  readonly nextTargetPercent?: number;
}

export interface DogfoodCoverageFloorResult {
  readonly ok: boolean;
  readonly coverage: DogfoodDocsCoverage;
  readonly floorPercent: number;
  readonly nextTargetPercent: number;
}

export function evaluateDogfoodCoverageFloor(
  coverage: DogfoodDocsCoverage,
  options: DogfoodCoverageFloorOptions = {},
): DogfoodCoverageFloorResult {
  const floorPercent = options.floorPercent ?? DOGFOOD_COVERAGE_FLOOR_PERCENT;
  const nextTargetPercent = options.nextTargetPercent ?? DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT;

  return {
    ok: coverage.percent >= floorPercent,
    coverage,
    floorPercent,
    nextTargetPercent,
  };
}

export function assertDogfoodCoverageFloor(
  coverage: DogfoodDocsCoverage,
  options: DogfoodCoverageFloorOptions = {},
): DogfoodCoverageFloorResult {
  const result = evaluateDogfoodCoverageFloor(coverage, options);
  if (!result.ok) {
    throw new Error(
      `DOGFOOD documentation coverage floor not met: ${coverage.percent}% ` +
      `(${coverage.documentedFamilies}/${coverage.totalFamilies} families) is below floor ${result.floorPercent}% ` +
      `(next target ${result.nextTargetPercent}%)`,
    );
  }
  return result;
}
