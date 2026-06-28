import type { Theme, TokenValue } from '../../packages/bijou/src/index.js';
import type { LandingThemeTokens } from './app-landing.js';
import {
  docsThemeAccentToken,
  docsThemeBorderToken,
  docsThemeDescriptionToken,
  docsThemeSurfaceToken,
} from './app-docs-theme-tokens.js';

export interface ThemeInspectorChromeTokens {
  readonly border: TokenValue;
  readonly body: TokenValue;
  readonly heading: TokenValue;
  readonly muted: TokenValue;
  readonly scrollThumb: TokenValue;
  readonly scrollTrack: TokenValue;
  readonly surface: TokenValue;
}

function withBackground(token: TokenValue, background: string): TokenValue {
  return { ...token, bg: token.bg ?? background };
}

export function themeInspectorChromeTokens(
  theme: Theme,
  visualTheme: LandingThemeTokens,
): ThemeInspectorChromeTokens {
  const surface = docsThemeSurfaceToken(visualTheme);
  const background = surface.bg ?? visualTheme.background;
  return {
    border: withBackground(docsThemeBorderToken(visualTheme), background),
    body: withBackground(surface, background),
    heading: withBackground(docsThemeAccentToken(visualTheme), background),
    muted: withBackground(docsThemeDescriptionToken(visualTheme), background),
    scrollThumb: withBackground(theme.ui.scrollThumb, background),
    scrollTrack: withBackground(theme.ui.scrollTrack, background),
    surface: withBackground(surface, background),
  };
}
