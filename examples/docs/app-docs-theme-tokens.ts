import type { PreferenceListTheme, TokenValue } from '../../packages/bijou/src/index.js';
import {
  pickStandoutColor,
  sampleColorRamp,
  type LandingThemeTokens,
} from './app-landing.js';

export function docsThemeAccentToken(theme: LandingThemeTokens): TokenValue {
  return { hex: sampleColorRamp(theme.logoRamp, 0.78), modifiers: ['bold'] };
}

export function docsThemeBorderToken(theme: LandingThemeTokens): TokenValue {
  return { hex: sampleColorRamp(theme.waveRamp, 0.58) };
}

export function docsThemeMutedBorderToken(theme: LandingThemeTokens): TokenValue {
  return { hex: sampleColorRamp(theme.waveRamp, 0.36), modifiers: ['dim'] };
}

export function docsThemeSurfaceToken(theme: LandingThemeTokens): TokenValue {
  return {
    hex: sampleColorRamp(theme.waveRamp, 0.44),
    bg: sampleColorRamp(theme.waveRamp, 0.06),
  };
}

export function docsThemeSelectedRowBgToken(theme: LandingThemeTokens): TokenValue {
  return {
    hex: sampleColorRamp(theme.waveRamp, 0.62),
    bg: sampleColorRamp(theme.waveRamp, 0.12),
  };
}

export function docsThemeDescriptionToken(theme: LandingThemeTokens): TokenValue {
  return {
    hex: sampleColorRamp(theme.waveRamp, 0.58),
    modifiers: ['dim'],
  };
}

export function resolveDocsThemeActiveHeaderTabToken(theme: LandingThemeTokens): TokenValue {
  const base = docsThemeSurfaceToken(theme).hex;
  const background = sampleColorRamp(theme.waveRamp, 0.14);
  return {
    hex: pickStandoutColor(background, base, [
      sampleColorRamp(theme.logoRamp, 0.98),
      sampleColorRamp(theme.logoRamp, 0.84),
      sampleColorRamp(theme.waveRamp, 0.88),
      sampleColorRamp(theme.logoRamp, 0.62),
    ]),
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
  const filledStart = pickStandoutColor(background, base, [
    sampleColorRamp(theme.waveRamp, 0.58),
    sampleColorRamp(theme.logoRamp, 0.34),
    sampleColorRamp(theme.waveRamp, 0.74),
  ]);
  const filledEnd = pickStandoutColor(background, filledStart, [
    sampleColorRamp(theme.logoRamp, 0.78),
    sampleColorRamp(theme.logoRamp, 0.96),
    sampleColorRamp(theme.waveRamp, 0.9),
  ]);
  return {
    filledToken: { hex: filledStart, modifiers: ['bold'] },
    filledEndToken: { hex: filledEnd, modifiers: ['bold'] },
    emptyToken: { hex: sampleColorRamp(theme.waveRamp, 0.22), modifiers: ['dim'] },
    labelToken: {
      hex: pickStandoutColor(background, base, [
        sampleColorRamp(theme.logoRamp, 0.9),
        sampleColorRamp(theme.waveRamp, 0.84),
        sampleColorRamp(theme.logoRamp, 0.7),
      ]),
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
    infoToken: { hex: sampleColorRamp(theme.waveRamp, 0.82) },
    descriptionToken: docsThemeDescriptionToken(theme),
  };
}

export function docsThemeUnfocusedGutterToken(theme: LandingThemeTokens): TokenValue {
  return {
    hex: sampleColorRamp(theme.waveRamp, 0.38),
    bg: sampleColorRamp(theme.waveRamp, 0.08),
    modifiers: ['dim'],
  };
}
