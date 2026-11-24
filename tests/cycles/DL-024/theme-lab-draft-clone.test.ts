import { describe, expect, it } from 'vitest';
import { PRESETS, ruleAuthoredDefinitions, type Theme } from '@flyingrobots/bijou';
import {
  createThemeLabEditorState,
  themeLabEditorNudge,
  themeLabEditorReset,
} from '../../../examples/docs/app-theme-lab-editor-model.js';
import { cloneThemeForThemeLabEditor } from '../../../examples/docs/app-theme-lab-editor-theme.js';
import {
  DOGFOOD_DARK_THEME,
  DOGFOOD_LIGHT_THEME,
} from '../../../examples/docs/dogfood-shell-themes.js';
import { themeLabProvenanceLines } from '../../../examples/docs/app-theme-lab-provenance.js';

const THEMES: readonly (readonly [string, Theme])[] = [
  ...Object.entries(PRESETS),
  ['dogfood-dark', DOGFOOD_DARK_THEME],
  ['dogfood-light', DOGFOOD_LIGHT_THEME],
];

/** Every mutable object reachable from a value, by identity. */
function objectsIn(value: unknown, seen = new Set<object>()): Set<object> {
  if (typeof value !== 'object' || value === null || seen.has(value)) return seen;
  seen.add(value);
  for (const child of Object.values(value)) objectsIn(child, seen);
  return seen;
}

describe('theme lab draft clone', () => {
  it('covers the preset list', () => {
    expect(THEMES.length).toBeGreaterThan(2);
  });

  for (const [id, theme] of THEMES) {
    describe(id, () => {
      const draft = cloneThemeForThemeLabEditor(theme);

      it('carries every field of the theme, whatever fields it has', () => {
        expect({ ...draft, name: theme.name }).toStrictEqual(theme);
        expect(draft.name).toBe(`${theme.name}-draft`);
      });

      it('shares no mutable object with the original', () => {
        const original = objectsIn(theme);
        const shared = [...objectsIn(draft)].filter((object) => original.has(object));
        expect(shared).toEqual([]);
      });

      it('keeps recoverable rule definitions when the original had them', () => {
        expect(ruleAuthoredDefinitions(draft)).toBe(ruleAuthoredDefinitions(theme));
      });
    });
  }
});

describe('theme lab draft provenance across edits', () => {
  const edited = themeLabEditorNudge(createThemeLabEditorState('dogfood:dark', DOGFOOD_DARK_THEME), 8);

  it('keeps definitions on a draft that has been edited', () => {
    expect(ruleAuthoredDefinitions(DOGFOOD_DARK_THEME)).toBeDefined();
    expect(ruleAuthoredDefinitions(edited.draftTheme)).toBe(ruleAuthoredDefinitions(DOGFOOD_DARK_THEME));
  });

  it('lets the panel explain the draft, not report flat token values', () => {
    const text = themeLabProvenanceLines(edited.draftTheme, 'semantic.accent', 'dark', undefined, {
      overrideHex: '#123456',
    }).map((line) => line.text).join('\n');
    expect(text).toContain('direct override');
    expect(text).toContain('rule most-vivid');
    expect(text).not.toContain('flat token values');
  });

  it('reset restores both the value and the provenance', () => {
    const reset = themeLabEditorReset(edited, DOGFOOD_DARK_THEME);
    expect(reset.draftTheme.semantic.primary).toStrictEqual(DOGFOOD_DARK_THEME.semantic.primary);
    expect(reset.directlyEditedPaths).toEqual([]);
    expect(ruleAuthoredDefinitions(reset.draftTheme)).toBe(ruleAuthoredDefinitions(DOGFOOD_DARK_THEME));
  });
});
