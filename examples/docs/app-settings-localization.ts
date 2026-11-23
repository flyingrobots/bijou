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
import type { DocsLocaleLocalization } from './app-locale-localization.js';

export function localizationSettingsSection(
  model: DocsExplorerModel,
  localization: LocalizationPort,
  localeLocalization: DocsLocaleLocalization,
): FrameSettingSection<DocsMsg> {
  const nextLocale = nextDogfoodLocale(model.locale);
  // The notice reports the switch, so it speaks the language being chosen.
  const nextLocalization = localeLocalization(nextLocale.id);
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
          title: shellText(nextLocalization, 'settings.title', 'Settings'),
          message: dogfoodText(
            nextLocalization,
            'settings.language.feedback',
            'Language set to {language}.',
            {
              language: dogfoodLocaleLabel(
                nextLocale.id,
                nextLocalization,
              ),
            },
          ),
        },
      },
    ],
  };
}
