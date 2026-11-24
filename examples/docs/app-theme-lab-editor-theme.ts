import {
  renameRuleAuthoredTheme,
  type Theme,
} from '../../packages/bijou/src/index.js';

/**
 * Copy a theme for editing. The copy is a deep structural clone, so a field
 * added to `Theme` later is carried without touching this file, and it keeps
 * the rule definitions the provenance panel reads.
 */
export function cloneThemeForThemeLabEditor(theme: Theme): Theme {
  return renameRuleAuthoredTheme(theme, draftThemeName(theme.name));
}

function draftThemeName(name: string): string {
  return `${name.replace(/(?:-draft)+$/u, '')}-draft`;
}
