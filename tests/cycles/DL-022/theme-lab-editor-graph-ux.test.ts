import { BIJOU_DARK } from '../../../packages/bijou/src/index.js';
import {
  createThemeLabEditorState,
  THEME_LAB_CHANNEL_BLUE,
  themeLabEditorNudge,
  themeLabEditorReset,
  themeLabEditorSelectChannel,
  themeLabEditorSelectedHex,
} from '../../../examples/docs/app-theme-lab-editor-model.js';
import { themeLabGraphNodes } from '../../../examples/docs/app-theme-lab-graph.js';

import { describe, expect, it } from 'vitest';

describe('DL-022 Theme Lab editor graph UX', () => {
  it('edits a cloned draft color and resets without mutating the active theme', () => {
    const originalHex = BIJOU_DARK.semantic.primary.hex;
    const initial = createThemeLabEditorState('dogfood:dark', BIJOU_DARK);
    const blueChannel = themeLabEditorSelectChannel(initial, THEME_LAB_CHANNEL_BLUE);
    const edited = themeLabEditorNudge(blueChannel, 12);

    expect(themeLabEditorSelectedHex(edited)).not.toBe(originalHex);
    expect(BIJOU_DARK.semantic.primary.hex).toBe(originalHex);
    expect(themeLabEditorSelectedHex(themeLabEditorReset(edited, BIJOU_DARK))).toBe(originalHex);
  });

  it('marks edited graph nodes and keeps dependency edges visible', () => {
    const initial = createThemeLabEditorState('dogfood:dark', BIJOU_DARK);
    const accentState = themeLabEditorNudge({
      ...initial,
      selectedIndex: 1,
    }, -20);
    const nodes = themeLabGraphNodes(BIJOU_DARK, accentState.draftTheme);
    const accent = nodes.find((node) => node.path === 'semantic.accent');

    expect(accent?.edited).toBe(true);
    expect(accent?.hex).toBe(themeLabEditorSelectedHex(accentState));
    expect(accent?.edges).toContain('border.secondary');
    expect(accent?.edges).toContain('ui.cursor');
  });
});
