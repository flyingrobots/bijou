import type {
  FrameSettingSection,
} from '../../packages/bijou-tui/src/app-frame.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import {
  dogfoodText,
  shellText,
} from './app-localization.js';
import type {
  DocsExplorerModel,
  DocsMsg,
} from './app-model.js';

export function shellSettingsSection(
  model: DocsExplorerModel,
  localization: LocalizationPort,
): FrameSettingSection<DocsMsg> {
  return {
    id: 'shell',
    title: dogfoodText(
      localization,
      'settings.section.shell',
      'Shell',
    ),
    rows: [
      {
        id: 'show-hints',
        label: dogfoodText(
          localization,
          'settings.showHints.label',
          'Show hints',
        ),
        description: dogfoodText(
          localization,
          'settings.showHints.description',
          'Show active-pane control cues in the footer. Turn this off for a quieter shell and use ? for the full key map.',
        ),
        valueLabel: model.showHints
          ? dogfoodText(
              localization,
              'settings.showHints.on',
              'On',
            )
          : dogfoodText(
              localization,
              'settings.showHints.off',
              'Off',
            ),
        checked: model.showHints,
        kind: 'toggle',
        action: { type: 'toggle-hints' },
        feedback: {
          title: shellText(localization, 'settings.title', 'Settings'),
          message: model.showHints
            ? dogfoodText(
                localization,
                'settings.showHints.feedback.off',
                'Show hints turned off.',
              )
            : dogfoodText(
                localization,
                'settings.showHints.feedback.on',
                'Show hints turned on.',
              ),
        },
      },
    ],
  };
}
