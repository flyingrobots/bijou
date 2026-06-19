import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { dogfoodLocalizedText, formatLocalizedList } from './localization.js';
import type {
  LandingModel,
  LandingQualityMode,
  LandingQualityProfileId,
  LandingQualityProfile,
} from './app-landing-types.js';

const LANDING_FPS_ALPHA = 0.2;
const LANDING_MODE_AUTO = 'auto' satisfies LandingQualityMode, LANDING_MODE_QUALITY = 'quality' satisfies LandingQualityMode;
const LANDING_MODE_BALANCED = 'balanced' satisfies LandingQualityMode, LANDING_MODE_PERFORMANCE = 'performance' satisfies LandingQualityMode;
const LANDING_PROFILE_FULL = 'full' satisfies LandingQualityProfileId, LANDING_PROFILE_BALANCED = 'balanced' satisfies LandingQualityProfileId;
const LANDING_PROFILE_ULTRA = 'ultra' satisfies LandingQualityProfileId;
const LANDING_QUALITY_PROFILES: readonly LandingQualityProfile[] = [
  { id: LANDING_PROFILE_FULL, maxArea: 14_000, frameStepMs: 16, fpsStep: 1, backgroundTile: 1, logoTile: 1 },
  { id: LANDING_PROFILE_BALANCED, maxArea: 28_000, frameStepMs: 33, fpsStep: 2, backgroundTile: 2, logoTile: 1 },
  { id: LANDING_PROFILE_ULTRA, maxArea: Number.POSITIVE_INFINITY, frameStepMs: 50, fpsStep: 5, backgroundTile: 3, logoTile: 1 },
] as const;
function dogfoodText(
  localization: LocalizationPort | undefined,
  id: string,
  fallback: string,
  values: Readonly<Record<string, unknown>> = {},
): string {
  return dogfoodLocalizedText(localization, id, fallback, values);
}
export function resolveLandingQuality(
  width: number,
  height: number,
  mode: LandingQualityMode = LANDING_MODE_AUTO,
): LandingQualityProfile {
  if (mode !== LANDING_MODE_AUTO) {
    const forced = LANDING_QUALITY_PROFILES.find((profile) => (
      (mode === LANDING_MODE_QUALITY && profile.id === LANDING_PROFILE_FULL)
      || (mode === LANDING_MODE_BALANCED && profile.id === LANDING_PROFILE_BALANCED)
      || (mode === LANDING_MODE_PERFORMANCE && profile.id === LANDING_PROFILE_ULTRA)
    ));
    if (forced != null) return forced;
  }
  const area = width * height;
  return LANDING_QUALITY_PROFILES.find((profile) => area <= profile.maxArea) ?? fallbackLandingQualityProfile();
}
function fallbackLandingQualityProfile(): LandingQualityProfile {
  const fallback = LANDING_QUALITY_PROFILES[LANDING_QUALITY_PROFILES.length - 1];
  if (fallback != null) return fallback;
  throw new Error();
}
export function quantizeLandingFps(quality: LandingQualityProfile, fps: number): number {
  if (quality.fpsStep <= 1) return fps;
  return Math.max(1, Math.round(fps / quality.fpsStep) * quality.fpsStep);
}
function landingQualityProfileLabel(quality: LandingQualityProfile, localization?: LocalizationPort): string {
  switch (quality.id) {
    case LANDING_PROFILE_FULL:
      return dogfoodText(localization, 'landing.quality.profile.full', 'full');
    case LANDING_PROFILE_BALANCED:
      return dogfoodText(localization, 'landing.quality.profile.balanced', 'balanced');
    case LANDING_PROFILE_ULTRA:
      return dogfoodText(localization, 'landing.quality.profile.performance', 'performance');
    default:
      return quality.id;
  }
}
export function landingQualityModeLabel(mode: LandingQualityMode, localization?: LocalizationPort): string {
  switch (mode) {
    case LANDING_MODE_AUTO:
      return dogfoodText(localization, 'landing.quality.auto', 'Auto');
    case LANDING_MODE_QUALITY:
      return dogfoodText(localization, 'landing.quality.quality', 'Quality');
    case LANDING_MODE_BALANCED:
      return dogfoodText(localization, 'landing.quality.balanced', 'Balanced');
    case LANDING_MODE_PERFORMANCE:
      return dogfoodText(localization, 'landing.quality.performance', 'Performance');
  }
}
export function landingQualityBadgeLabel(
  quality: LandingQualityProfile,
  mode: LandingQualityMode,
  localization?: LocalizationPort,
): string {
  if (mode === LANDING_MODE_AUTO) {
    return `auto/${landingQualityProfileLabel(quality, localization)}`;
  }
  return landingQualityModeLabel(mode, localization).toLowerCase();
}
export function nextLandingQualityMode(mode: LandingQualityMode): LandingQualityMode {
  switch (mode) {
    case LANDING_MODE_AUTO:
      return LANDING_MODE_QUALITY;
    case LANDING_MODE_QUALITY:
      return LANDING_MODE_BALANCED;
    case LANDING_MODE_BALANCED:
      return LANDING_MODE_PERFORMANCE;
    case LANDING_MODE_PERFORMANCE:
      return LANDING_MODE_AUTO;
  }
}
export function previousLandingQualityMode(mode: LandingQualityMode): LandingQualityMode {
  switch (mode) {
    case LANDING_MODE_AUTO:
      return LANDING_MODE_PERFORMANCE;
    case LANDING_MODE_QUALITY:
      return LANDING_MODE_AUTO;
    case LANDING_MODE_BALANCED:
      return LANDING_MODE_QUALITY;
    case LANDING_MODE_PERFORMANCE:
      return LANDING_MODE_BALANCED;
  }
}
export function landingQualitySettingValue(
  width: number,
  height: number,
  mode: LandingQualityMode,
  localization?: LocalizationPort,
): string {
  if (mode !== LANDING_MODE_AUTO) return landingQualityModeLabel(mode, localization);
  const profile = landingQualityProfileLabel(resolveLandingQuality(width, height, mode), localization);
  return `${landingQualityModeLabel(mode, localization)} (${profile})`;
}
export function landingQualityOptions(localization?: LocalizationPort): string {
  return formatLocalizedList(localization, [
    landingQualityModeLabel(LANDING_MODE_AUTO, localization),
    landingQualityModeLabel(LANDING_MODE_QUALITY, localization),
    landingQualityModeLabel(LANDING_MODE_BALANCED, localization),
    landingQualityModeLabel(LANDING_MODE_PERFORMANCE, localization),
  ]);
}
export function resolveLandingQualityMode(model: Pick<LandingModel, 'docsModel'>): LandingQualityMode {
  return model.docsModel.pageModels[model.docsModel.activePageId]?.landingQualityMode ?? LANDING_MODE_AUTO;
}
export function updateLandingFps(current: number, dtSeconds: number): number {
  if (!(dtSeconds > 0)) return current;
  const instantFps = Math.max(1, Math.round(1 / dtSeconds));
  if (current <= 0) return instantFps;
  return Math.max(1, Math.round((current * (1 - LANDING_FPS_ALPHA)) + (instantFps * LANDING_FPS_ALPHA)));
}
