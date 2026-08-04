import { BIJOU_DARK, BIJOU_LIGHT, PRESETS } from '@flyingrobots/bijou';
import type { FrameShellThemeSpec } from '@flyingrobots/bijou-tui';

/**
 * Preset ids that the lab presents as one mode-aware family rather than as
 * two unrelated entries. Keeping them paired is what makes the light/dark
 * mode toggle meaningful instead of a jump between strangers.
 */
const PAIRED_PRESET_IDS: ReadonlySet<string> = new Set(['bijou-dark', 'bijou-light']);

function labelFromPresetId(id: string): string {
  return id
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function standalonePresetSpecs(): readonly FrameShellThemeSpec[] {
  return Object.entries(PRESETS)
    .filter(([id]) => !PAIRED_PRESET_IDS.has(id))
    .map(([id, theme]) => ({
      id,
      label: labelFromPresetId(id),
      theme,
      description: `Built-in ${id} preset.`,
    }));
}

/**
 * Every built-in preset, offered to the frame as selectable shell themes.
 *
 * The first-party pair is a mode-aware family so the frame's own
 * `toggle-shell-theme-mode` action can flip light/dark in place. Every other
 * preset is a single concrete choice.
 */
export const LAB_SHELL_THEMES: readonly FrameShellThemeSpec[] = [
  {
    id: 'bijou',
    label: 'Bijou',
    modes: [
      {
        id: 'dark',
        label: 'Dark',
        theme: BIJOU_DARK,
        description: 'First-party dark preset. 16 hand-authored hex literals.',
      },
      {
        id: 'light',
        label: 'Light',
        theme: BIJOU_LIGHT,
        description: 'First-party light preset. 17 hand-authored hex literals.',
      },
    ],
  },
  ...standalonePresetSpecs(),
];
