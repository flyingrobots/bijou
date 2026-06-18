import { afterEach, describe, expect, it } from 'vitest';
import { _resetDefaultContextForTesting } from '@flyingrobots/bijou/adapters/test';
import { docsShellThemesForTesting } from '../../../examples/docs/app.js';

describe('DL-018 first-party theme variant coverage', () => {
  afterEach(() => _resetDefaultContextForTesting());

  it('classifies every DOGFOOD first-party shell theme as paired or single-mode from the shell spec', () => {
    const themes = docsShellThemesForTesting();
    const [dogfood, ...singleModeThemes] = themes;

    expect(dogfood?.id).toBe('dogfood');
    expect(dogfood?.theme).toBeUndefined();
    expect(dogfood?.modes?.map((mode) => mode.id)).toEqual(['dark', 'light']);

    expect(singleModeThemes.length).toBeGreaterThan(0);
    for (const theme of singleModeThemes) {
      expect(theme.theme, `${theme.id} should be a concrete single-mode theme`).toBeDefined();
      expect(theme.modes, `${theme.id} should not declare mode siblings`).toBeUndefined();
    }
  });
});
