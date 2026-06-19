import {
  cloneContextWithTheme,
  type BijouContext,
  type Theme,
} from '../../packages/bijou/src/index.js';
import type { FrameShellThemeSpec } from '../../packages/bijou-tui/src/index.js';
import {
  docsVisualThemeFromShellThemeChoice,
  landingThemeIndexById,
  landingTokensToShellTheme,
  LANDING_THEMES,
  resolveLandingTheme,
  type LandingTextModifiers,
  type LandingThemeTokens,
} from './app-landing.js';
import { DOGFOOD_SHELL_THEMES } from './dogfood-shell-themes.js';

export interface DocsShellThemeChoice {
  readonly id: string;
  readonly label: string;
  readonly shellThemeId: string;
  readonly shellThemeLabel: string;
  readonly modeId?: string;
  readonly modeLabel?: string;
  readonly theme: Theme;
}

export interface DocsShellThemeState {
  readonly shellThemes: readonly FrameShellThemeSpec[];
  readonly choices: readonly DocsShellThemeChoice[];
  readonly visualThemeByShellId: ReadonlyMap<string, LandingThemeTokens>;
}

export function createDocsShellThemeState(textModifiers: LandingTextModifiers): DocsShellThemeState {
  const shellThemes = [
    ...DOGFOOD_SHELL_THEMES,
    ...LANDING_THEMES.map((theme) => ({
      id: theme.id,
      label: theme.label,
      theme: landingTokensToShellTheme(theme, textModifiers),
    })),
  ];
  const choices = flattenDocsShellThemeChoices(shellThemes);
  return {
    shellThemes,
    choices,
    visualThemeByShellId: new Map<string, LandingThemeTokens>([
      ...LANDING_THEMES.map((theme) => [theme.id, theme] as const),
      ...choices
        .filter((choice) => landingThemeIndexById(choice.id) === undefined)
        .map((choice) => [choice.id, docsVisualThemeFromShellThemeChoice(choice)] as const),
    ]),
  };
}

function docsShellThemeChoiceId(shellThemeId: string, modeId?: string): string {
  return modeId === undefined ? shellThemeId : `${shellThemeId}:${modeId}`;
}

function flattenDocsShellThemeChoices(shellThemes: readonly FrameShellThemeSpec[]): readonly DocsShellThemeChoice[] {
  return shellThemes.flatMap((shellTheme) => {
    if (shellTheme.theme !== undefined) {
      return [{
        id: docsShellThemeChoiceId(shellTheme.id),
        label: shellTheme.label,
        shellThemeId: shellTheme.id,
        shellThemeLabel: shellTheme.label,
        theme: shellTheme.theme,
      }];
    }
    return shellTheme.modes.map((mode) => ({
      id: docsShellThemeChoiceId(shellTheme.id, mode.id),
      label: `${shellTheme.label} / ${mode.label}`,
      shellThemeId: shellTheme.id,
      shellThemeLabel: shellTheme.label,
      modeId: mode.id,
      modeLabel: mode.label,
      theme: mode.theme,
    }));
  });
}

export function resolveDocsShellThemeById(
  state: DocsShellThemeState,
  id: string | undefined,
): DocsShellThemeChoice {
  return state.choices.find((theme) => theme.id === id) ?? fallbackDocsShellThemeChoice(state);
}

export function resolveLandingThemeIndexForShellThemeId(
  state: DocsShellThemeState,
  id: string | undefined,
): number {
  return landingThemeIndexById(resolveDocsShellThemeById(state, id).id) ?? 0;
}

export function resolveDocsVisualThemeByShellThemeId(
  state: DocsShellThemeState,
  id: string | undefined,
): LandingThemeTokens {
  const shellThemeId = resolveDocsShellThemeById(state, id).id;
  return state.visualThemeByShellId.get(shellThemeId) ?? resolveLandingTheme(0);
}

function fallbackDocsShellThemeChoice(state: DocsShellThemeState): DocsShellThemeChoice {
  const fallback = state.choices[0];
  if (fallback != null) return fallback;
  throw new Error();
}

export function applyDocsShellThemeToContext(
  state: DocsShellThemeState,
  ctx: BijouContext,
  themeId: string | undefined,
): BijouContext {
  return cloneContextWithTheme(ctx, resolveDocsShellThemeById(state, themeId).theme);
}
