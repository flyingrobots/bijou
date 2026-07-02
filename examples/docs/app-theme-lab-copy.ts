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

export function themeLabCopy(options: ThemeLabCopyOptions): ThemeLabCopy {
  const { activeLabel, draftTheme, activeShellLine, localization } = options;
  const activeLine = dogfoodText(localization, 'themeInspector.active', 'Active: {label}', {
    label: activeLabel,
  });
  const themeLine = dogfoodText(localization, 'themeInspector.theme', 'Theme: {name}', {
    name: draftTheme.name,
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
