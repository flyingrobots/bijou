import type { TextModifier } from '../../packages/bijou/src/index.js';
import type { LandingTextModifiers } from './app-landing.js';
import { createDocsShellThemeState } from './app-docs-shell-theme.js';

const DIM_MODIFIERS: TextModifier[] = ['dim'];
const BOLD_MODIFIERS: TextModifier[] = ['bold'];
const DIM_STRIKETHROUGH_MODIFIERS: TextModifier[] = [
  'dim',
  'strikethrough',
];

export const LANDING_TEXT_MODIFIERS: LandingTextModifiers = {
  dim: DIM_MODIFIERS,
  bold: BOLD_MODIFIERS,
  dimStrikethrough: DIM_STRIKETHROUGH_MODIFIERS,
};

export const DOCS_SHELL_THEME_STATE = createDocsShellThemeState(
  LANDING_TEXT_MODIFIERS,
);

export const DOCS_SHELL_THEME_CHOICES = DOCS_SHELL_THEME_STATE.choices;

export function docsShellThemesForTesting() {
  return DOCS_SHELL_THEME_STATE.shellThemes;
}
