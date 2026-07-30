import type {
  FrameSettingSection,
} from '../../packages/bijou-tui/src/app-frame.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import {
  landingQualityModeLabel,
  landingQualitySettingDescription,
  landingQualitySettingValue,
  nextLandingQualityMode,
} from './app-landing.js';
import {
  dogfoodText,
  shellText,
} from './app-localization.js';
import type {
  DocsExplorerModel,
  DocsMsg,
} from './app-model.js';

export function landingSettingsSection(
  columns: number,
  rows: number,
  model: DocsExplorerModel,
  localization: LocalizationPort,
): FrameSettingSection<DocsMsg> {
  const nextMode = nextLandingQualityMode(model.landingQualityMode);
  return {
    id: 'landing',
    title: dogfoodText(
      localization,
      'settings.section.landing',
      'Landing',
    ),
    rows: [
      {
        id: 'landing-quality',
        label: dogfoodText(
          localization,
          'settings.landingQuality.label',
          'Landing quality',
        ),
        description: landingQualitySettingDescription(
          columns,
          rows,
          model.landingQualityMode,
          localization,
        ),
        valueLabel: landingQualitySettingValue(
          columns,
          rows,
          model.landingQualityMode,
          localization,
        ),
        kind: 'choice',
        action: { type: 'cycle-landing-quality' },
        feedback: {
          title: shellText(localization, 'settings.title', 'Settings'),
          message: dogfoodText(
            localization,
            'settings.landingQuality.feedback',
            'Landing quality set to {quality}.',
            {
              quality: landingQualityModeLabel(
                nextMode,
                localization,
              ),
            },
          ),
        },
      },
    ],
  };
}
