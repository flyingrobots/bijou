/**
 * Scenario registry.
 *
 * Harnesses (wall-time bench, memory analysis, sandbox) import this
 * file to enumerate and look up scenarios by ID. Adding a new
 * scenario: create a new module under bench/src/scenarios/, export
 * its Scenario object, and add it to the SCENARIOS array below.
 */

import type { AnyScenario, ScenarioTagGroup } from './types.js';
import { paintGradientRgb } from './paint-gradient-rgb.js';
import { paintThemeSet } from './paint-set-hex-palette.js';
import { paintThemeSetFast } from './paint-set-preparsed-palette.js';
import { paintAscii } from './paint-ascii.js';
import { paintRgbFixed } from './paint-rgb-fixed.js';
import { diffGradient } from './diff-gradient.js';
import { diffSparse } from './diff-sparse.js';
import { diffStatic } from './diff-static.js';
import { dogfoodRealistic } from './dogfood-realistic.js';
import { soak } from './soak.js';
import { flame } from './flame.js';
import { componentApp } from './component-app.js';

export { type Scenario, type AnyScenario, type ScenarioTagGroup } from './types.js';

export const SCENARIOS: readonly AnyScenario[] = [
  paintAscii,
  paintRgbFixed,
  paintThemeSet,
  paintThemeSetFast,
  paintGradientRgb,
  diffGradient,
  diffSparse,
  diffStatic,
  dogfoodRealistic,
  componentApp,
  flame,
  soak,
] as unknown as readonly AnyScenario[]; // Scenario<T> is invariant on T; cast required for the heterogeneous registry

const SCENARIO_ALIASES: Readonly<Record<string, string>> = {
  'paint-theme-set': 'paint-set-hex-palette',
  'paint-theme-set-fast': 'paint-set-preparsed-palette',
};

export function parseScenarioTagGroup(value: string): ScenarioTagGroup {
  const tags = [...new Set(
    value
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0),
  )];

  if (tags.length === 0) {
    throw new Error(`invalid --tag value: ${JSON.stringify(value)}`);
  }

  return tags;
}

export function listScenarioTags(): readonly string[] {
  return [...new Set(SCENARIOS.flatMap((scenario) => scenario.tags))].sort();
}

export function scenarioMatchesTagGroups(
  scenario: AnyScenario,
  tagGroups: readonly ScenarioTagGroup[] = [],
): boolean {
  if (tagGroups.length === 0) return true;
  return tagGroups.some((group) => group.every((tag) => scenario.tags.includes(tag)));
}

export function selectScenarios(options: {
  readonly ids?: readonly string[];
  readonly tagGroups?: readonly ScenarioTagGroup[];
} = {}): readonly AnyScenario[] {
  const selected = options.ids != null
    ? options.ids.map(getScenario)
    : SCENARIOS;
  const filtered = selected.filter((scenario) => scenarioMatchesTagGroups(scenario, options.tagGroups));

  if (filtered.length === 0) {
    const activeFilters = [
      options.ids != null && options.ids.length > 0 ? `scenario=${options.ids.join(',')}` : null,
      options.tagGroups != null && options.tagGroups.length > 0
        ? `tags=${options.tagGroups.map((group) => group.join('+')).join('|')}`
        : null,
    ].filter(Boolean).join(', ');
    const availableTags = listScenarioTags().join(', ');
    throw new Error(`no scenarios match ${activeFilters || 'the requested filters'} (available tags: ${availableTags})`);
  }

  return filtered;
}

/** Look up a scenario by ID, or throw if not found. */
export function getScenario(id: string): AnyScenario {
  const resolvedId = SCENARIO_ALIASES[id] ?? id;
  const match = SCENARIOS.find((s) => s.id === resolvedId);
  if (!match) {
    throw new Error(`unknown scenario: ${id} (available: ${SCENARIOS.map((s) => s.id).join(', ')})`);
  }
  return match;
}

/** List all scenario IDs. */
export function listScenarioIds(): readonly string[] {
  return SCENARIOS.map((s) => s.id);
}
