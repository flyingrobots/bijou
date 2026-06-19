import {
  CYAN_MAGENTA,
  tv,
  type Theme,
} from '../../packages/bijou/src/index.js';
import {
  gradientStopsFromHexes,
  sampleColorRamp,
} from './app-landing-colors.js';
import type {
  LandingTextModifiers,
  LandingThemeTokens,
} from './app-landing-types.js';

export function landingTokensToShellTheme(
  theme: LandingThemeTokens,
  modifiers: LandingTextModifiers,
): Theme {
  return {
    ...CYAN_MAGENTA,
    name: `dogfood-${theme.id}`,
    status: {
      ...CYAN_MAGENTA.status,
      success: tv(sampleColorRamp(theme.waveRamp, 0.78)),
      error: tv(sampleColorRamp(theme.logoRamp, 0.7)),
      warning: tv(sampleColorRamp(theme.logoRamp, 0.92)),
      info: tv(sampleColorRamp(theme.waveRamp, 0.66)),
      active: tv(sampleColorRamp(theme.logoRamp, 0.84)),
      muted: tv(sampleColorRamp(theme.waveRamp, 0.44), modifiers.dimStrikethrough),
    },
    semantic: {
      ...CYAN_MAGENTA.semantic,
      success: tv(sampleColorRamp(theme.waveRamp, 0.78)),
      error: tv(sampleColorRamp(theme.logoRamp, 0.7)),
      warning: tv(sampleColorRamp(theme.logoRamp, 0.92)),
      info: tv(sampleColorRamp(theme.waveRamp, 0.66)),
      accent: tv(sampleColorRamp(theme.logoRamp, 0.84)),
      muted: tv(sampleColorRamp(theme.waveRamp, 0.58), modifiers.dim),
      primary: tv(sampleColorRamp(theme.logoRamp, 0.96), modifiers.bold),
    },
    gradient: {
      ...CYAN_MAGENTA.gradient,
      brand: gradientStopsFromHexes([
        sampleColorRamp(theme.waveRamp, 0.08),
        sampleColorRamp(theme.waveRamp, 0.52),
        sampleColorRamp(theme.logoRamp, 0.9),
      ]),
      progress: gradientStopsFromHexes([
        sampleColorRamp(theme.waveRamp, 0.24),
        sampleColorRamp(theme.waveRamp, 0.62),
        sampleColorRamp(theme.logoRamp, 0.76),
        sampleColorRamp(theme.logoRamp, 0.94),
      ]),
    },
    border: {
      ...CYAN_MAGENTA.border,
      primary: tv(sampleColorRamp(theme.waveRamp, 0.72)),
      secondary: tv(sampleColorRamp(theme.logoRamp, 0.74)),
      success: tv(sampleColorRamp(theme.waveRamp, 0.78)),
      warning: tv(sampleColorRamp(theme.logoRamp, 0.92)),
      error: tv(sampleColorRamp(theme.logoRamp, 0.7)),
      muted: tv(sampleColorRamp(theme.waveRamp, 0.38)),
    },
    ui: {
      ...CYAN_MAGENTA.ui,
      cursor: tv(sampleColorRamp(theme.logoRamp, 0.88)),
      focusGutter: { hex: sampleColorRamp(theme.logoRamp, 0.82), bg: sampleColorRamp(theme.waveRamp, 0.12), modifiers: modifiers.bold },
      scrollThumb: tv(sampleColorRamp(theme.logoRamp, 0.88)),
      scrollTrack: tv(sampleColorRamp(theme.waveRamp, 0.18)),
      sectionHeader: tv(sampleColorRamp(theme.waveRamp, 0.8), modifiers.bold),
      logo: tv(sampleColorRamp(theme.logoRamp, 0.94)),
      tableHeader: tv(sampleColorRamp(theme.logoRamp, 0.9)),
      trackEmpty: tv(sampleColorRamp(theme.waveRamp, 0.26)),
    },
    surface: {
      primary: { hex: sampleColorRamp(theme.logoRamp, 0.96), bg: theme.background },
      secondary: { hex: sampleColorRamp(theme.waveRamp, 0.84), bg: sampleColorRamp(theme.waveRamp, 0.14) },
      elevated: { hex: sampleColorRamp(theme.logoRamp, 0.92), bg: sampleColorRamp(theme.waveRamp, 0.18) },
      overlay: { hex: sampleColorRamp(theme.logoRamp, 0.96), bg: theme.background },
      muted: { hex: sampleColorRamp(theme.waveRamp, 0.62), bg: sampleColorRamp(theme.waveRamp, 0.08) },
    },
  };
}
