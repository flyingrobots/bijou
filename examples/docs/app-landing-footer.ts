import type { Surface } from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { dogfoodLocalizedText } from './localization.js';
import {
  clamp01,
  sampleColorRamp,
} from './app-landing-colors.js';
import { landingQualityBadgeLabel } from './app-landing-quality.js';
import { createTransparentTextSurface } from './app-landing-text.js';
import type {
  LandingQualityMode,
  LandingQualityProfile,
  LandingTextModifiers,
  LandingThemeTokens,
} from './app-landing-types.js';

const LANDING_STATIC_SURFACE_CACHE = new Map<string, { readonly footerControls: Surface; readonly footerVersion: Surface }>();
const LANDING_FPS_BADGE_CACHE = new Map<string, Surface>();

function dogfoodText(
  localization: LocalizationPort | undefined,
  id: string,
  fallback: string,
  values: Readonly<Record<string, unknown>> = {},
): string {
  return dogfoodLocalizedText(localization, id, fallback, values);
}

export function getLandingStaticSurfaces(
  tokens: LandingThemeTokens,
  localization: LocalizationPort,
  modifiers: LandingTextModifiers,
  versionText: string,
): { readonly footerControls: Surface; readonly footerVersion: Surface } {
  const controlsText = dogfoodText(
    localization,
    'landing.footer.controls',
    'Esc/q quit • ↑/↓ quality • ←/→ theme • Enter continue',
  );
  const cacheKey = `${tokens.id}:${controlsText}:${versionText}`;
  const cached = LANDING_STATIC_SURFACE_CACHE.get(cacheKey);
  if (cached) return cached;

  const surfaces = {
    footerControls: createTransparentTextSurface(controlsText, {
      bg: tokens.background,
      transparentSpaces: false,
      fg: tokens.footerMutedColor,
      modifiers: modifiers.dim,
    }),
    footerVersion: createTransparentTextSurface(versionText, {
      bg: tokens.background,
      transparentSpaces: false,
      fg: tokens.footerStrongColor,
      modifiers: modifiers.bold,
    }),
  };
  LANDING_STATIC_SURFACE_CACHE.set(cacheKey, surfaces);
  return surfaces;
}

export function createLandingPromptSurface(
  tokens: LandingThemeTokens,
  modifiers: LandingTextModifiers,
  timeMs: number,
  localization?: LocalizationPort,
): Surface {
  const promptText = dogfoodText(localization, 'landing.prompt.enter', 'Press [Enter]');
  const highlightStart = promptText.indexOf('[');
  const highlightEnd = promptText.indexOf(']');
  const enterStart = highlightStart >= 0 && highlightEnd > highlightStart ? highlightStart + 1 : -1;
  const enterEnd = highlightEnd > enterStart ? highlightEnd - 1 : -1;
  const time = timeMs / 1000;

  return createTransparentTextSurface(promptText, {
    bg: tokens.background,
    transparentSpaces: false,
    fg: (x) => {
      const inEnter = enterStart >= 0 && enterEnd >= enterStart && x >= enterStart && x <= enterEnd;
      if (inEnter) {
        const span = Math.max(1, enterEnd - enterStart);
        const local = (x - enterStart) / span;
        const sweep = 0.5 + (Math.sin((time * 5.2) + (local * Math.PI * 2.6)) * 0.5);
        return sampleColorRamp(tokens.logoRamp, clamp01(0.42 + (local * 0.34) + (sweep * 0.22)));
      }
      if (x === highlightStart || x === highlightEnd) return sampleColorRamp(tokens.waveRamp, 0.76);
      if (highlightStart < 0 || highlightEnd < highlightStart || x < highlightStart || x > highlightEnd) {
        return tokens.promptBodyColor;
      }
      return tokens.promptAccentColor;
    },
    modifiers: (x) => {
      const inHighlight = highlightStart >= 0 && highlightEnd >= highlightStart && x >= highlightStart && x <= highlightEnd;
      return inHighlight ? modifiers.bold : modifiers.dim;
    },
  });
}

export function getLandingFpsBadge(
  tokens: LandingThemeTokens,
  fps: number,
  quality: LandingQualityProfile,
  mode: LandingQualityMode,
  modifiers: LandingTextModifiers,
  localization?: LocalizationPort,
): Surface {
  const qualityLabel = landingQualityBadgeLabel(quality, mode, localization);
  const label = dogfoodText(localization, 'landing.footer.fpsBadge', '{fps} fps • {quality}', {
    fps: String(fps),
    quality: qualityLabel,
  });
  const key = `${tokens.id}:${String(fps)}:${quality.id}:${mode}:${qualityLabel}`;
  const cached = LANDING_FPS_BADGE_CACHE.get(key);
  if (cached) return cached;

  const surface = createTransparentTextSurface(label, {
    bg: tokens.background,
    transparentSpaces: false,
    fg: tokens.fpsColor,
    modifiers: modifiers.dim,
  });
  LANDING_FPS_BADGE_CACHE.set(key, surface);
  return surface;
}
