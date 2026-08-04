import {
  BIJOU_DARK,
  BIJOU_LIGHT,
  type Theme,
} from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { dogfoodSafePairSummary, themeColorReuseSummary } from './app-theme-diagnostics.js';
import { dogfoodLocalizedText } from './localization.js';

interface ThemeLabCopyOptions {
  readonly activeLabel: string;
  readonly draftTheme: Theme;
  /** The shell theme the draft was cloned from, named as the rest of the app names it. */
  readonly baseTheme: Theme;
  readonly activeShellLine: string;
  readonly localization?: LocalizationPort;
}

export interface ThemeLabCopy {
  readonly editorContext: readonly string[];
  readonly defaultSummary: string;
}

function dogfoodText(
  localization: LocalizationPort | undefined,
  id: string,
  fallback: string,
  values: Readonly<Record<string, unknown>> = {},
): string {
  return dogfoodLocalizedText(localization, id, fallback, values);
}

/**
 * The theme name to show a reader, with an edited marker when the draft has
 * diverged from the shell theme it was cloned from.
 */
export function themeLabDisplayName(
  baseTheme: Theme,
  draftTheme: Theme,
  localization: LocalizationPort | undefined,
): string {
  const edited = draftTheme.semantic.accent.hex !== baseTheme.semantic.accent.hex
    || draftTheme.semantic.primary.hex !== baseTheme.semantic.primary.hex
    || draftTheme.surface.primary.bg !== baseTheme.surface.primary.bg;
  return edited
    ? dogfoodText(localization, 'themeLab.editedName', '{name} (edited)', { name: baseTheme.name })
    : baseTheme.name;
}

export function themeLabCopy(options: ThemeLabCopyOptions): ThemeLabCopy {
  const { activeLabel, draftTheme, baseTheme, activeShellLine, localization } = options;
  const activeLine = dogfoodText(localization, 'themeInspector.active', 'Active: {label}', {
    label: activeLabel,
  });
  // Report the shell theme's own name rather than the editor's internal draft
  // clone. `dogfood-dark-draft` exists nowhere else in the app and reads like
  // a different theme; an explicit edited marker says what actually happened.
  const themeLine = dogfoodText(localization, 'themeInspector.theme', 'Theme: {name}', {
    name: themeLabDisplayName(baseTheme, draftTheme, localization),
  });
  const defaultDarkLine = dogfoodText(
    localization,
    'themeLab.defaultDark',
    'Default dark preset: {name} ({summary})',
    {
      name: BIJOU_DARK.name,
      summary: dogfoodSafePairSummary(BIJOU_DARK, localization),
    },
  );
  const defaultLightLine = dogfoodText(
    localization,
    'themeLab.defaultLight',
    'Default light preset: {name} ({summary})',
    {
      name: BIJOU_LIGHT.name,
      summary: dogfoodSafePairSummary(BIJOU_LIGHT, localization),
    },
  );
  const colorReuseLine = dogfoodText(
    localization,
    'themeLab.colorReuseLine',
    'Color reuse: dark {dark}; light {light}.',
    {
      dark: themeColorReuseSummary(BIJOU_DARK, localization),
      light: themeColorReuseSummary(BIJOU_LIGHT, localization),
    },
  );
  const sharedLines = [
    activeLine,
    themeLine,
    dogfoodSafePairSummary(draftTheme, localization),
    defaultDarkLine,
    defaultLightLine,
    colorReuseLine,
  ];

  return {
    editorContext: [...sharedLines, activeShellLine],
    defaultSummary: [
      ...sharedLines,
      dogfoodText(
        localization,
        'themeLab.swatchCoverage',
        'Draft swatches include semantic.primary, surface.primary, and graph-edited token rows.',
      ),
      dogfoodText(
        localization,
        'themeLab.f10Hint',
        'F10 opens the Theme Inspector drawer from the docs shell.',
      ),
    ].join('\n'),
  };
}
