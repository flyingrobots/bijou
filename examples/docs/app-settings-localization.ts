import type {
  FrameSettingSection,
} from '../../packages/bijou-tui/src/app-frame.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import {
  dogfoodLocaleLabel,
  nextDogfoodLocale,
} from './locale.js';
import {
  dogfoodLocaleSettingDescription,
  dogfoodText,
  shellText,
} from './app-localization.js';
import type {
  DocsExplorerModel,
  DocsMsg,
} from './app-model.js';

export function localizationSettingsSection(
  model: DocsExplorerModel,
  localization: LocalizationPort,
): FrameSettingSection<DocsMsg> {
  const nextLocale = nextDogfoodLocale(model.locale);
  return {
    id: 'localization',
    title: dogfoodText(
      localization,
      'settings.section.localization',
      'Localization',
    ),
    rows: [
      {
        id: 'preferred-language',
        label: dogfoodText(
          localization,
          'settings.language.label',
          'Preferred language',
        ),
        description: dogfoodLocaleSettingDescription(
          model.locale,
          localization,
        ),
        valueLabel: dogfoodLocaleLabel(model.locale, localization),
        kind: 'choice',
        action: { type: 'cycle-locale' },
        feedback: {
          title: shellText(localization, 'settings.title', 'Settings'),
          message: dogfoodText(
            localization,
            'settings.language.feedback',
            'Language set to {language}.',
            {
              language: dogfoodLocaleLabel(
                nextLocale.id,
                localization,
              ),
            },
          ),
        },
      },
    ],
  };
}
