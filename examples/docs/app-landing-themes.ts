import type { TokenValue } from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { dogfoodLocalizedText } from './localization.js';
import {
  buildColorRamp,
  createGradientStops,
  mod,
  sampleColorRamp,
} from './app-landing-colors.js';
import type {
  LandingShellThemeChoice,
  LandingThemeSeed,
  LandingThemeTokens,
} from './app-landing-types.js';

const LANDING_THEME_SEEDS: readonly LandingThemeSeed[] = [
  { id: 'blocklab-workstation', background: '#18172b', waveGradient: ['#2f3f66', '#5f87c8', '#f2c96b'], logoGradient: ['#8ba8ff', '#f3b57a', '#ffd86d'] },
  { id: 'cabinet-of-curiosities', background: '#1d1720', waveGradient: ['#55413a', '#9f7754', '#d7ba7f'], logoGradient: ['#8eb489', '#d8b26e', '#d47a4f'] },
  { id: 'soft-arcade', background: '#161a26', waveGradient: ['#31557c', '#67a2d3', '#f4a57c'], logoGradient: ['#9bb6ff', '#f0a0bf', '#ffd76e'] },
  { id: 'moss-and-embers', background: '#171d1b', waveGradient: ['#40594b', '#84af86', '#ef9d51'], logoGradient: ['#6fa9a3', '#dfbf73', '#ee7c56'] },
  { id: 'paper-moon', background: '#1f1d24', waveGradient: ['#52506f', '#8c8ab8', '#f3ceb0'], logoGradient: ['#8eb7d8', '#d9a7c7', '#f4d98b'] },
  { id: 'verdant-plum', background: '#043015', waveGradient: ['#265408', '#968425', '#b96862'], logoGradient: ['#968425', '#b96862', '#c281af'] },
] as const;

export const LANDING_THEMES: readonly LandingThemeTokens[] = LANDING_THEME_SEEDS.map(compileLandingTheme);
export const LANDING_THEME_COUNT = LANDING_THEMES.length;
const LANDING_THEME_INDEX_BY_ID = new Map(LANDING_THEMES.map((theme, index) => [theme.id, index] as const));

function dogfoodText(
  localization: LocalizationPort | undefined,
  id: string,
  fallback: string,
  values: Readonly<Record<string, unknown>> = {},
): string {
  return dogfoodLocalizedText(localization, id, fallback, values);
}

function landingThemeLabel(id: string, localization?: LocalizationPort): string {
  switch (id) {
    case 'blocklab-workstation':
      return dogfoodText(localization, 'landing.theme.blocklabWorkstation', 'BlockLab Workstation');
    case 'cabinet-of-curiosities':
      return dogfoodText(localization, 'landing.theme.cabinetOfCuriosities', 'Cabinet of Curiosities');
    case 'soft-arcade':
      return dogfoodText(localization, 'landing.theme.softArcade', 'Soft Arcade');
    case 'moss-and-embers':
      return dogfoodText(localization, 'landing.theme.mossAndEmbers', 'Moss and Embers');
    case 'paper-moon':
      return dogfoodText(localization, 'landing.theme.paperMoon', 'Paper Moon');
    case 'verdant-plum':
      return dogfoodText(localization, 'landing.theme.verdantPlum', 'Verdant Plum');
    default:
      return id;
  }
}

function compileLandingTheme(seed: LandingThemeSeed): LandingThemeTokens {
  const waveRamp = buildColorRamp(createGradientStops(seed.waveGradient));
  const logoRamp = buildColorRamp(createGradientStops(seed.logoGradient));

  return {
    id: seed.id,
    label: landingThemeLabel(seed.id),
    background: seed.background,
    waveRamp,
    logoRamp,
    promptBodyColor: sampleColorRamp(waveRamp, 0.58),
    promptAccentColor: sampleColorRamp(logoRamp, 0.92),
    footerMutedColor: sampleColorRamp(waveRamp, 0.52),
    footerStrongColor: sampleColorRamp(logoRamp, 0.88),
    fpsColor: sampleColorRamp(waveRamp, 0.62),
  };
}

export function normalizeLandingThemeIndex(index: number): number {
  return mod(index, LANDING_THEME_COUNT);
}

export function resolveLandingTheme(index: number): LandingThemeTokens {
  return LANDING_THEMES[normalizeLandingThemeIndex(index)] ?? fallbackLandingTheme();
}

export function fallbackLandingTheme(): LandingThemeTokens {
  const fallback = LANDING_THEMES[0];
  if (fallback != null) return fallback;
  throw new Error();
}

export function nextLandingThemeIndex(current: number, delta: number): number {
  return normalizeLandingThemeIndex(current + delta);
}

export function landingThemeIndexById(id: string | undefined): number | undefined {
  return id === undefined ? undefined : LANDING_THEME_INDEX_BY_ID.get(id);
}

function themeTokenHex(token: TokenValue | undefined, fallback: string): string {
  return token?.hex ?? fallback;
}

function themeTokenBg(token: TokenValue | undefined, fallback: string): string {
  return token?.bg ?? fallback;
}

export function docsVisualThemeFromShellThemeChoice(shellTheme: LandingShellThemeChoice): LandingThemeTokens {
  const theme = shellTheme.theme;
  const background = themeTokenBg(theme.surface.primary, '#10131a');
  return compileLandingTheme({
    id: shellTheme.id,
    background,
    waveGradient: [
      themeTokenBg(theme.surface.muted, background),
      themeTokenBg(theme.surface.secondary, background),
      themeTokenHex(theme.border.primary, themeTokenHex(theme.semantic.info, '#6aa6ff')),
    ],
    logoGradient: [
      themeTokenHex(theme.semantic.info, '#6aa6ff'),
      themeTokenHex(theme.semantic.accent, '#d7a84f'),
      themeTokenHex(theme.semantic.primary, '#f5f2e8'),
    ],
  });
}
