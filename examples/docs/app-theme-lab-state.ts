import type { Theme } from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import type { DocsShellThemeChoice } from './app-docs-shell-theme.js';
import {
  themeLabCopy,
  themeLabDisplayName,
  type ThemeLabCopy,
} from './app-theme-lab-copy.js';
import { dogfoodText } from './app-theme-lab-provenance-contract.js';

/** Describe which shell theme owns the draft using localizable visible copy. */
export function themeLabActiveShellLine(
  activeTheme: DocsShellThemeChoice,
  shellThemes: readonly DocsShellThemeChoice[],
  draftTheme: Theme,
  localization: LocalizationPort | undefined,
): string {
  const activeShellIndex = shellThemes.findIndex(
    (shellTheme) => shellTheme.id === activeTheme.id,
  );
  const displayName = themeLabDisplayName(activeTheme.theme, draftTheme, localization);
  return activeShellIndex >= 0
    ? dogfoodText(
      localization,
      'themeLab.activeShell.numbered',
      '* {index}. {label} -> {name}',
      { index: String(activeShellIndex + 1), label: activeTheme.label, name: displayName },
    )
    : dogfoodText(
      localization,
      'themeLab.activeShell',
      '* {label} -> {name}',
      { label: activeTheme.label, name: displayName },
    );
}

export function themeLabPaneCopy(
  activeTheme: DocsShellThemeChoice,
  shellThemes: readonly DocsShellThemeChoice[],
  draftTheme: Theme,
  localization: LocalizationPort | undefined,
): ThemeLabCopy {
  return themeLabCopy({
    activeLabel: activeTheme.label,
    draftTheme,
    baseTheme: activeTheme.theme,
    activeShellLine: themeLabActiveShellLine(activeTheme, shellThemes, draftTheme, localization),
    localization,
  });
}
