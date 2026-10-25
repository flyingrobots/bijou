import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import type { FrameShellThemeSpec } from '../../packages/bijou-tui/src/index.js';
import type { DocsShellThemeChoice } from './app-docs-shell-theme.js';
import { landingThemeIndexById, landingThemeLabel } from './app-landing-themes.js';
import { dogfoodLocalizedText } from './localization.js';

type DogfoodPairedThemeId = 'book' | 'dogfood';
const PAIRED_THEME_IDS = ['book', 'dogfood'] satisfies readonly DogfoodPairedThemeId[];

function themeText(
  localization: LocalizationPort | undefined,
  scope: string,
  fallback: string,
): string {
  return dogfoodLocalizedText(localization, `shell.theme.${scope}`, fallback);
}

/** Keep presentation bound to this app's live locale, without changing theme identity. */
export function localizeDogfoodShellThemes(
  specs: readonly FrameShellThemeSpec[],
  localization: LocalizationPort,
): readonly FrameShellThemeSpec[] {
  return Object.freeze(specs.map(spec => {
    if (spec.modes === undefined) {
      if (landingThemeIndexById(spec.id) === undefined) return spec;
      return Object.freeze({ ...spec, get label() { return landingThemeLabel(spec.id, localization); } });
    }
    if (!PAIRED_THEME_IDS.some(id => id === spec.id)) return spec;
    return Object.freeze({
      ...spec,
      get label() { return themeText(localization, `${spec.id}.label`, spec.label); },
      get description() { return themeText(localization, `${spec.id}.description`, spec.description ?? ''); },
      modes: Object.freeze(spec.modes.map(mode => Object.freeze({
        ...mode,
        get label() { return themeText(localization, `${spec.id}.${mode.id}.label`, mode.label); },
        get description() { return themeText(localization, `${spec.id}.${mode.id}.description`, mode.description ?? ''); },
      }))),
    });
  }));
}

/** Localize the same choices used by Theme Lab and Inspector at render time. */
export function localizedDocsShellThemeChoice(
  choice: DocsShellThemeChoice,
  localization: LocalizationPort | undefined,
): DocsShellThemeChoice {
  if (choice.modeId === undefined) {
    if (landingThemeIndexById(choice.id) === undefined) return choice;
    const label = landingThemeLabel(choice.id, localization);
    return { ...choice, label, shellThemeLabel: label };
  }
  if (!PAIRED_THEME_IDS.some(id => id === choice.shellThemeId)) return choice;
  const family = themeText(localization, `${choice.shellThemeId}.label`, choice.shellThemeLabel);
  const mode = themeText(localization, `${choice.shellThemeId}.${choice.modeId}.label`, choice.modeLabel ?? choice.modeId);
  return { ...choice, label: `${family} / ${mode}`, shellThemeLabel: family, modeLabel: mode };
}
