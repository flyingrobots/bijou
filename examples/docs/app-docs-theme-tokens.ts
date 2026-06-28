import type { PreferenceListTheme, TokenValue } from '../../packages/bijou/src/index.js';
import {
  sampleColorRamp,
  type LandingThemeTokens,
} from './app-landing.js';
import {
  DOCS_BODY_TEXT_RATIO,
  DOCS_CHROME_RATIO,
  DOCS_READABLE_TEXT_RATIO,
  docsPanelBackground,
  docsReadableCandidates,
  docsReadableColor,
  pickReadableColor,
} from './app-docs-theme-contrast.js';

export function docsThemeAccentToken(theme: LandingThemeTokens): TokenValue {
  return {
    hex: docsReadableColor(theme, theme.background, sampleColorRamp(theme.logoRamp, 0.78), DOCS_BODY_TEXT_RATIO),
    modifiers: ['bold'],
  };
}

export function docsThemeBorderToken(theme: LandingThemeTokens): TokenValue {
  const background = docsPanelBackground(theme);
  return {
    hex: docsReadableColor(theme, background, sampleColorRamp(theme.waveRamp, 0.58), DOCS_CHROME_RATIO),
  };
}

export function docsThemeMutedBorderToken(theme: LandingThemeTokens): TokenValue {
  const background = docsPanelBackground(theme);
  return {
    hex: docsReadableColor(theme, background, sampleColorRamp(theme.waveRamp, 0.36), DOCS_CHROME_RATIO),
  };
}

export function docsThemeSurfaceToken(theme: LandingThemeTokens): TokenValue {
  const background = docsPanelBackground(theme);
  return {
    hex: docsReadableColor(theme, background, sampleColorRamp(theme.waveRamp, 0.44), DOCS_READABLE_TEXT_RATIO),
    bg: background,
  };
}

export function docsThemeSelectedRowBgToken(theme: LandingThemeTokens): TokenValue {
  const background = sampleColorRamp(theme.waveRamp, 0.12);
  return {
    hex: docsReadableColor(theme, background, sampleColorRamp(theme.waveRamp, 0.62), DOCS_READABLE_TEXT_RATIO),
    bg: background,
  };
}

export function docsThemeDescriptionToken(theme: LandingThemeTokens): TokenValue {
  const background = docsPanelBackground(theme);
  return {
    hex: docsReadableColor(theme, background, sampleColorRamp(theme.waveRamp, 0.58), DOCS_BODY_TEXT_RATIO),
  };
}

export function resolveDocsThemeActiveHeaderTabToken(theme: LandingThemeTokens): TokenValue {
  const base = docsThemeSurfaceToken(theme).hex;
  const background = sampleColorRamp(theme.waveRamp, 0.14);
  return {
    hex: docsReadableColor(theme, background, base, DOCS_BODY_TEXT_RATIO),
    bg: background,
    modifiers: ['bold'],
  };
}

export function docsThemeProgressTokens(theme: LandingThemeTokens): {
  readonly filledToken: TokenValue;
  readonly filledEndToken: TokenValue;
  readonly emptyToken: TokenValue;
  readonly labelToken: TokenValue;
} {
  const surface = docsThemeSurfaceToken(theme);
  const background = surface.bg ?? theme.background;
  const base = surface.hex;
  const filledStart = pickReadableColor(background, base, [
    sampleColorRamp(theme.waveRamp, 0.58),
    sampleColorRamp(theme.logoRamp, 0.34),
    sampleColorRamp(theme.waveRamp, 0.74),
    ...docsReadableCandidates(theme),
  ], DOCS_CHROME_RATIO);
  const filledEnd = pickReadableColor(background, filledStart, [
    sampleColorRamp(theme.logoRamp, 0.78),
    sampleColorRamp(theme.logoRamp, 0.96),
    sampleColorRamp(theme.waveRamp, 0.9),
    ...docsReadableCandidates(theme),
  ], DOCS_CHROME_RATIO);
  return {
    filledToken: { hex: filledStart, modifiers: ['bold'] },
    filledEndToken: { hex: filledEnd, modifiers: ['bold'] },
    emptyToken: {
      hex: docsReadableColor(theme, background, sampleColorRamp(theme.waveRamp, 0.22), DOCS_CHROME_RATIO),
    },
    labelToken: {
      hex: docsReadableColor(theme, background, base, DOCS_BODY_TEXT_RATIO),
      modifiers: ['bold'],
    },
  };
}

export function docsThemePreferenceListTheme(theme: LandingThemeTokens): PreferenceListTheme {
  return {
    sectionTitleToken: docsThemeAccentToken(theme),
    selectedRowBgToken: docsThemeSelectedRowBgToken(theme),
    toggleOnToken: docsThemeAccentToken(theme),
    toggleOffToken: docsThemeMutedBorderToken(theme),
    choiceToken: docsThemeAccentToken(theme),
    infoToken: {
      hex: docsReadableColor(theme, docsPanelBackground(theme), sampleColorRamp(theme.waveRamp, 0.82), DOCS_BODY_TEXT_RATIO),
    },
    descriptionToken: docsThemeDescriptionToken(theme),
  };
}

export function docsThemeUnfocusedGutterToken(theme: LandingThemeTokens): TokenValue {
  const background = sampleColorRamp(theme.waveRamp, 0.08);
  return {
    hex: docsReadableColor(theme, background, sampleColorRamp(theme.waveRamp, 0.38), DOCS_CHROME_RATIO),
    bg: background,
  };
}
