import { createKeyMap, type KeyMap } from '../../packages/bijou-tui/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { dogfoodText } from './app-theme-lab-provenance-contract.js';
import {
  THEME_LAB_CHANNEL_BLUE,
  THEME_LAB_CHANNEL_GREEN,
  THEME_LAB_CHANNEL_RED,
  type ThemeLabEditorChannel,
} from './app-theme-lab-editor-types.js';

const NUDGE_STEP = 8;

/** What a Theme Lab editor key does. */
export type ThemeLabEditorAction =
  | { readonly type: 'select', readonly delta: number }
  | { readonly type: 'channel', readonly channel: ThemeLabEditorChannel }
  | { readonly type: 'nudge', readonly delta: number }
  | { readonly type: 'reset' };

/**
 * Theme Lab editor keys, declared as a real key map.
 *
 * These used to be a `switch` over raw char codes, which meant no tooling
 * could see them: the frame's collision check reads `keyMap.bindings()`, found
 * nothing, and never noticed that the editor was eating the frame's own keys.
 * Declaring them here makes them introspectable, so
 * `findKeyBindingConflicts()` can compare them against the frame.
 *
 * `n`/`p` and `1`/`2`/`3` are chosen because the frame already owns `[`, `]`,
 * and `g` — the previous bindings — for tab navigation and scroll-to-top.
 */
export function createThemeLabEditorKeyMap(
  localization?: LocalizationPort,
): KeyMap<ThemeLabEditorAction> {
  // dogfoodText is called directly rather than through a local alias: the
  // localization scanner recognizes the call by name, so an alias would hide
  // these fallbacks and count them as untranslated copy.
  const nudgeUp = dogfoodText(localization, 'themeLab.keys.nudgeUp', 'Nudge channel up');
  return createKeyMap<ThemeLabEditorAction>()
    .bind('n', dogfoodText(localization, 'themeLab.keys.next', 'Next editable color'),
      { type: 'select', delta: 1 })
    .bind('p', dogfoodText(localization, 'themeLab.keys.previous', 'Previous editable color'),
      { type: 'select', delta: -1 })
    .bind('1', dogfoodText(localization, 'themeLab.keys.red', 'Red channel'),
      { type: 'channel', channel: THEME_LAB_CHANNEL_RED })
    .bind('2', dogfoodText(localization, 'themeLab.keys.green', 'Green channel'),
      { type: 'channel', channel: THEME_LAB_CHANNEL_GREEN })
    .bind('3', dogfoodText(localization, 'themeLab.keys.blue', 'Blue channel'),
      { type: 'channel', channel: THEME_LAB_CHANNEL_BLUE })
    .bind('+', nudgeUp, { type: 'nudge', delta: NUDGE_STEP })
    .bind('=', nudgeUp, { type: 'nudge', delta: NUDGE_STEP })
    .bind('-', dogfoodText(localization, 'themeLab.keys.nudgeDown', 'Nudge channel down'),
      { type: 'nudge', delta: -NUDGE_STEP })
    .bind('0', dogfoodText(localization, 'themeLab.keys.reset', 'Reset draft'),
      { type: 'reset' });
}

const DEFAULT_EDITOR_KEYS = createThemeLabEditorKeyMap();

/** Resolve an unmodified key press against the editor key map. */
export function themeLabEditorActionForKey(key: string): ThemeLabEditorAction | undefined {
  return DEFAULT_EDITOR_KEYS.handle({
    type: 'key',
    key,
    ctrl: false,
    alt: false,
    shift: false,
  });
}
