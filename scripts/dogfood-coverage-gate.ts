#!/usr/bin/env tsx

import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import {
  DOGFOOD_COVERAGE_FLOOR_PERCENT,
  DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT,
  assertDogfoodCoverageFloor,
  type DogfoodCoverageFloorOptions,
} from '../examples/docs/coverage-policy.js';
import { resolveDogfoodDocsCoverage } from '../examples/docs/coverage.js';
import { COMPONENT_STORIES } from '../examples/docs/stories.js';

export interface DogfoodCoverageGateIO extends DogfoodCoverageFloorOptions {
  readonly stdout?: (text: string) => void;
  readonly stderr?: (text: string) => void;
}

export function runDogfoodCoverageGate(io: DogfoodCoverageGateIO = {}): number {
  const stdout = io.stdout ?? ((text: string) => process.stdout.write(text));
  const stderr = io.stderr ?? ((text: string) => process.stderr.write(text));
  const coverage = resolveDogfoodDocsCoverage(COMPONENT_STORIES);

  try {
    const result = assertDogfoodCoverageFloor(coverage, {
      floorPercent: io.floorPercent,
      nextTargetPercent: io.nextTargetPercent,
    });
    stdout(
      `dogfood-coverage: ok (${coverage.percent}% = ${coverage.documentedFamilies}/${coverage.totalFamilies} families; ` +
      `floor ${result.floorPercent}%; next target ${result.nextTargetPercent}%)\n`,
    );
    return 0;
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : `DOGFOOD documentation coverage floor not met (floor ${io.floorPercent ?? DOGFOOD_COVERAGE_FLOOR_PERCENT}%; next target ${io.nextTargetPercent ?? DOGFOOD_NEXT_COVERAGE_TARGET_PERCENT}%)`;
    stderr(`${message}\n`);
    return 1;
  }
}

function main(): void {
  process.exitCode = runDogfoodCoverageGate();
}

if (process.argv[1] != null && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
