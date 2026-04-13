import { describe, expect, it } from 'vitest';
import {
  listScenarioTags,
  parseScenarioTagGroup,
  scenarioMatchesTagGroups,
  selectScenarios,
} from './index.js';
import { diffGradient } from './diff-gradient.js';

describe('scenario tag helpers', () => {
  it('parses comma-separated tag groups as normalized AND clauses', () => {
    expect(parseScenarioTagGroup(' Diff, gradient ,diff ')).toEqual(['diff', 'gradient']);
  });

  it('matches OR across tag groups and AND within each group', () => {
    expect(scenarioMatchesTagGroups(diffGradient, [
      parseScenarioTagGroup('paint,gradient'),
      parseScenarioTagGroup('diff,gradient'),
    ])).toBe(true);
    expect(scenarioMatchesTagGroups(diffGradient, [
      parseScenarioTagGroup('paint,gradient'),
    ])).toBe(false);
  });

  it('selects scenarios by tag groups', () => {
    expect(selectScenarios({
      tagGroups: [parseScenarioTagGroup('paint,unique-styles')],
    }).map((scenario) => scenario.id)).toEqual(['paint-gradient-rgb']);

    expect(selectScenarios({
      tagGroups: [
        parseScenarioTagGroup('dogfood'),
        parseScenarioTagGroup('nightly'),
      ],
    }).map((scenario) => scenario.id)).toEqual(['dogfood-realistic', 'soak']);
  });

  it('lists the declared tag vocabulary', () => {
    expect(listScenarioTags()).toContain('diff');
    expect(listScenarioTags()).toContain('paint');
    expect(listScenarioTags()).toContain('unique-styles');
  });
});
