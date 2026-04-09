/**
 * Scenario registry.
 *
 * Harnesses (wall-time bench, memory analysis, sandbox) import this
 * file to enumerate and look up scenarios by ID. Adding a new
 * scenario: create a new module under bench/src/scenarios/, export
 * its Scenario object, and add it to the SCENARIOS array below.
 */

import type { AnyScenario } from './types.js';
import { paintGradientRgb } from './paint-gradient-rgb.js';
import { paintThemeSet } from './paint-theme-set.js';
import { paintAscii } from './paint-ascii.js';
import { paintRgbFixed } from './paint-rgb-fixed.js';
import { diffGradient } from './diff-gradient.js';

export { type Scenario, type AnyScenario } from './types.js';

export const SCENARIOS: readonly AnyScenario[] = [
  paintAscii,
  paintRgbFixed,
  paintThemeSet,
  paintGradientRgb,
  diffGradient,
] as unknown as readonly AnyScenario[];

/** Look up a scenario by ID, or throw if not found. */
export function getScenario(id: string): AnyScenario {
  const match = SCENARIOS.find((s) => s.id === id);
  if (!match) {
    throw new Error(`unknown scenario: ${id} (available: ${SCENARIOS.map((s) => s.id).join(', ')})`);
  }
  return match;
}

/** List all scenario IDs. */
export function listScenarioIds(): readonly string[] {
  return SCENARIOS.map((s) => s.id);
}
