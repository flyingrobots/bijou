import {
  BIJOU_DARK,
  BIJOU_LIGHT,
  defineThemeSafePairs,
  type RGB,
  type Theme,
  type TokenValue,
} from '../../packages/bijou/src/index.js';
import type { FrameShellTheme } from '../../packages/bijou-tui/src/index.js';

function cloneToken(token: TokenValue): TokenValue {
  return {
    ...token,
    ...(token.modifiers === undefined ? {} : { modifiers: [...token.modifiers] }),
    ...(token.fgRGB === undefined ? {} : { fgRGB: [...token.fgRGB] as RGB }),
    ...(token.bgRGB === undefined ? {} : { bgRGB: [...token.bgRGB] as RGB }),
  };
}

function cloneTokenRecord<T extends Record<string, TokenValue>>(tokens: T): T {
  return Object.fromEntries(
    Object.entries(tokens).map(([key, token]) => [key, cloneToken(token)]),
  ) as T;
}

function cloneThemeWithName(theme: Theme, name: string): Theme {
  return {
    ...theme,
    name,
    status: cloneTokenRecord(theme.status),
    semantic: cloneTokenRecord(theme.semantic),
    gradient: Object.fromEntries(
      Object.entries(theme.gradient).map(([key, stops]) => [
        key,
        stops.map((stop) => ({
          pos: stop.pos,
          color: [...stop.color] as RGB,
        })),
      ]),
    ) as Theme['gradient'],
    border: cloneTokenRecord(theme.border),
    ui: cloneTokenRecord(theme.ui),
    surface: cloneTokenRecord(theme.surface),
  };
}

const DOGFOOD_DARK_THEME = cloneThemeWithName(BIJOU_DARK, 'dogfood-dark');
const DOGFOOD_LIGHT_THEME = cloneThemeWithName(BIJOU_LIGHT, 'dogfood-light');

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
}

export const DOGFOOD_THEME_SAFE_PAIRS = dogfoodPairs.build();

export const DOGFOOD_SHELL_THEMES: readonly FrameShellTheme[] = Object.freeze([
  {
    id: 'dogfood',
    label: 'DOGFOOD',
    description: 'High-contrast neutral docs shell with dark and light modes.',
    modes: [
      {
        id: 'dark',
        label: 'Dark',
        description: 'High-contrast neutral docs shell for dark terminals.',
        theme: DOGFOOD_DARK_THEME,
      },
      {
        id: 'light',
        label: 'Light',
        description: 'High-contrast neutral docs shell for light terminals.',
        theme: DOGFOOD_LIGHT_THEME,
      },
    ],
  },
]);
