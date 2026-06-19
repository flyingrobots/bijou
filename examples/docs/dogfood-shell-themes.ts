import {
  BIJOU_DARK,
  BIJOU_LIGHT,
  defineThemeSafePairs,
  type Theme,
} from '../../packages/bijou/src/index.js';
import type { FrameShellThemeSpec } from '../../packages/bijou-tui/src/index.js';
import { dogfoodLocalizedText } from './localization.js';

function dogfoodText(id: string, fallback: string): string {
  return dogfoodLocalizedText(undefined, id, fallback);
}

function cloneThemeWithName(theme: Theme, name: string): Theme {
  return {
    ...structuredClone(theme),
    name,
  };
}

export const DOGFOOD_DARK_THEME = cloneThemeWithName(BIJOU_DARK, 'dogfood-dark');
export const DOGFOOD_LIGHT_THEME = cloneThemeWithName(BIJOU_LIGHT, 'dogfood-light');

const DOGFOOD_READABLE_FOREGROUNDS = [
  'semantic.primary',
  'semantic.muted',
  'semantic.accent',
  'semantic.info',
  'semantic.success',
  'semantic.warning',
  'semantic.error',
] as const;

const DOGFOOD_STATUS_FOREGROUNDS = [
  'status.active',
  'status.pending',
] as const;

const DOGFOOD_SURFACE_BACKGROUNDS = [
  'surface.primary.bg',
  'surface.secondary.bg',
  'surface.elevated.bg',
  'surface.overlay.bg',
  'surface.muted.bg',
] as const;

const dogfoodPairs = defineThemeSafePairs();

for (const foreground of DOGFOOD_READABLE_FOREGROUNDS) {
  for (const background of DOGFOOD_SURFACE_BACKGROUNDS) {
    dogfoodPairs.readable(foreground, background);
  }
}

for (const foreground of DOGFOOD_STATUS_FOREGROUNDS) {
  for (const background of DOGFOOD_SURFACE_BACKGROUNDS) {
    dogfoodPairs.status(foreground, background);
  }
}

for (const background of DOGFOOD_SURFACE_BACKGROUNDS) {
  dogfoodPairs.chrome('ui.cursor', background);
  dogfoodPairs.chrome('border.primary', background);
  dogfoodPairs.chrome('border.secondary', background);
  dogfoodPairs.chrome('ui.scrollThumb', background);
  dogfoodPairs.chrome('border.muted', background, { minRatio: 3 });
  dogfoodPairs.chrome('ui.scrollTrack', background, { minRatio: 3 });
}

dogfoodPairs.chrome('ui.focusGutter', 'ui.focusGutter.bg');

export const DOGFOOD_THEME_SAFE_PAIRS = dogfoodPairs.build();

export const DOGFOOD_SHELL_THEMES: readonly FrameShellThemeSpec[] = Object.freeze([
  {
    id: 'dogfood',
    label: dogfoodText('shell.theme.dogfood.label', 'DOGFOOD'),
    description: dogfoodText(
      'shell.theme.dogfood.description',
      'High-contrast neutral docs shell with dark and light modes.',
    ),
    modes: [
      {
        id: 'dark',
        label: dogfoodText('shell.theme.dogfood.dark.label', 'Dark'),
        description: dogfoodText(
          'shell.theme.dogfood.dark.description',
          'High-contrast neutral docs shell for dark terminals.',
        ),
        theme: DOGFOOD_DARK_THEME,
      },
      {
        id: 'light',
        label: dogfoodText('shell.theme.dogfood.light.label', 'Light'),
        description: dogfoodText(
          'shell.theme.dogfood.light.description',
          'High-contrast neutral docs shell for light terminals.',
        ),
        theme: DOGFOOD_LIGHT_THEME,
      },
    ],
  },
]);
