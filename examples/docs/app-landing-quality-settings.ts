import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { dogfoodLocalizedText } from './localization.js';
import {
  landingQualityModeLabel,
  landingQualityOptions,
  resolveLandingQuality,
} from './app-landing-quality.js';
import type { LandingQualityMode } from './app-landing-types.js';

function dogfoodText(
  localization: LocalizationPort | undefined,
  id: string,
  fallback: string,
  values: Readonly<Record<string, unknown>> = {},
): string {
  return dogfoodLocalizedText(localization, id, fallback, values);
}

export function landingQualitySettingDescription(
  width: number,
  height: number,
  mode: LandingQualityMode,
  localization?: LocalizationPort,
): string {
  const currentProfile = landingQualityModeLabel(mode, localization);
  const options = landingQualityOptions(localization);
  switch (mode) {
    case 'auto':
      return dogfoodText(
        localization,
        'settings.landingQuality.description.auto',
        'Adapts render cost to terminal size. Current auto profile: {profile}. Options: {options}.',
        { profile: resolveLandingQuality(width, height, mode).id, options },
      );
    case 'quality':
      return dogfoodText(
        localization,
        'settings.landingQuality.description.quality',
        'Prioritizes the richest title treatment even on larger terminals. Options: {options}.',
        { options },
      );
    case 'balanced':
      return dogfoodText(
        localization,
        'settings.landingQuality.description.balanced',
        'Keeps the title screen expressive while reducing render work on larger terminals. Options: {options}.',
        { options },
      );
    case 'performance':
      return dogfoodText(
        localization,
        'settings.landingQuality.description.performance',
        'Minimizes title-screen work for giant terminals and slower emulators. Options: {options}.',
        { options },
      );
  }
  return currentProfile;
}
