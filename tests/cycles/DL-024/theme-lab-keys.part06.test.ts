import { describe, expect, it } from 'vitest';
import {
  describeKeyBindingConflict,
  findKeyBindingConflicts,
} from '@flyingrobots/bijou-tui';
import { createFrameKeyMap } from '../../../packages/bijou-tui/src/app-frame-keymap.js';
import { createThemeLabEditorKeyMap } from '../../../examples/docs/app-theme-lab-editor-keys.js';

const THEME_LAB_EDITOR_KEYS = createThemeLabEditorKeyMap();
import {
  createThemeLabEditorState,
  themeLabEditorSelectedPath,
  themeLabEditorUpdateForKey,
} from '../../../examples/docs/app-theme-lab-editor-model.js';
import { DOCS_SHELL_THEME_CHOICES } from '../../../examples/docs/app-shell-theme-state.js';

function activeTheme() {
  const choice = DOCS_SHELL_THEME_CHOICES[0];
  if (choice === undefined) throw new Error('No shell theme choices.');
  return choice.theme;
}

describe('theme lab editor keys', () => {
  it('does not collide with the frame it runs inside', () => {
    // The regression: the editor bound [, ] and g as raw char codes, which the
    // frame already owns for previous tab, next tab, and scroll-to-top. Because
    // the editor never declared a key map, no collision check could see them.
    const conflicts = findKeyBindingConflicts([
      {
        source: 'frame',
        bindings: createFrameKeyMap({ enableSettings: true, enableNotifications: true }).bindings(),
      },
      { source: 'theme-lab', bindings: THEME_LAB_EDITOR_KEYS.bindings() },
    ]);

    expect(conflicts.map(describeKeyBindingConflict)).toEqual([]);
  });

  it('leaves the frame keys it used to eat alone', () => {
    const claimed = new Set(THEME_LAB_EDITOR_KEYS.bindings().map((binding) => binding.combo.key));
    for (const frameKey of ['[', ']', 'g', 'j', 'k', 'd', 'u', 'q', 'tab']) {
      expect(claimed.has(frameKey), `theme lab must not claim "${frameKey}"`).toBe(false);
    }
  });

  it('declares every key it actually handles', () => {
    const claimed = THEME_LAB_EDITOR_KEYS.bindings().map((binding) => binding.combo.key);
    const theme = activeTheme();
    const state = createThemeLabEditorState('dogfood:dark', theme);

    for (const key of claimed) {
      expect(
        themeLabEditorUpdateForKey(state, theme, key),
        `declared key "${key}" is not handled`,
      ).toBeDefined();
    }
  });

  it('ignores keys it does not declare, so the frame still gets them', () => {
    const theme = activeTheme();
    const state = createThemeLabEditorState('dogfood:dark', theme);
    for (const key of ['[', ']', 'g', 'j', 'tab']) {
      expect(themeLabEditorUpdateForKey(state, theme, key)).toBeUndefined();
    }
  });
});

describe('theme lab editor key behaviour', () => {
  const theme = activeTheme();
  const state = createThemeLabEditorState('dogfood:dark', theme);

  it('moves the selection with n and p', () => {
    const next = themeLabEditorUpdateForKey(state, theme, 'n');
    expect(next).toBeDefined();
    if (next === undefined) return;
    expect(themeLabEditorSelectedPath(next)).not.toBe(themeLabEditorSelectedPath(state));

    const back = themeLabEditorUpdateForKey(next, theme, 'p');
    expect(back).toBeDefined();
    if (back === undefined) return;
    expect(themeLabEditorSelectedPath(back)).toBe(themeLabEditorSelectedPath(state));
  });

  it('selects channels with 1, 2 and 3', () => {
    const red = themeLabEditorUpdateForKey(state, theme, '1');
    const green = themeLabEditorUpdateForKey(state, theme, '2');
    const blue = themeLabEditorUpdateForKey(state, theme, '3');
    expect(red?.channel).toBe(0);
    expect(green?.channel).toBe(1);
    expect(blue?.channel).toBe(2);
  });

  it('nudges the selected channel with - and +', () => {
    const blue = themeLabEditorUpdateForKey(state, theme, '3');
    expect(blue).toBeDefined();
    if (blue === undefined) return;

    const nudged = themeLabEditorUpdateForKey(blue, theme, '+');
    expect(nudged?.draftTheme.semantic.primary.hex)
      .not.toBe(blue.draftTheme.semantic.primary.hex);
  });
});
