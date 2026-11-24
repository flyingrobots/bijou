import { SCENARIOS } from './scenarios/index.js';
import type { AnyScenario } from './scenarios/types.js';

export const displayScenarios = SCENARIOS.filter(
  (s): s is AnyScenario & { getDisplaySurface: NonNullable<AnyScenario['getDisplaySurface']> } =>
    s.getDisplaySurface !== undefined,
);

if (displayScenarios.length === 0) {
  throw new Error('No display scenarios found — at least one scenario must define getDisplaySurface');
}
