import { commandIntent, defineBlock, defineDataRequirement, defineViewData } from '@flyingrobots/bijou';
import type { BlockDefinition } from '@flyingrobots/bijou';
import { DOGFOOD_BLOCK_MODES, DOGFOOD_BLOCK_PACKAGE } from './dogfood-block-common.js';
import { renderSettingsMenuBlock } from './dogfood-block-settings-menu-render.js';

export interface SettingsMenuBlockRow {
  readonly id: string;
  readonly label: string;
  readonly valueLabel?: string;
  readonly description?: string;
}

export interface SettingsMenuBlockSection {
  readonly id: string;
  readonly title: string;
  readonly rows: readonly SettingsMenuBlockRow[];
}

export interface SettingsMenuBlockConfig {
  readonly sectionCount?: number;
  readonly activeSettingLabel?: string;
  readonly sections?: readonly SettingsMenuBlockSection[];
}

export const settingsSectionsRequirement = defineDataRequirement({
  id: 'settings.sections',
  resource: 'dogfood.settings.sections',
  label: 'Settings sections',
  description: 'Frame-owned DOGFOOD settings sections visible to the settings menu.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'SettingsMenuBlock' }],
});

export const settingsSelectionRequirement = defineDataRequirement({
  id: 'settings.selection',
  resource: 'dogfood.settings.selection',
  label: 'Settings selection',
  description: 'Current settings row focus inside the frame-owned settings menu.',
  optional: true,
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'SettingsMenuBlock' }],
});

export const settingsMenuData = defineViewData({
  id: 'settings-menu.data',
  label: 'SettingsMenuBlock data',
  description: 'DOGFOOD frame settings sections and active row.',
  requirements: [
    { name: 'sections', requirement: settingsSectionsRequirement },
    { name: 'selection', requirement: settingsSelectionRequirement },
  ],
});

export const settingsActivateRowIntent = commandIntent<{ readonly rowId: string }>(
  'settings.activateRow',
  {
    label: 'Activate row',
    description: 'Request activation of the focused settings row.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'SettingsMenuBlock' }],
  },
);

export const settingsSetLocaleIntent = commandIntent<{ readonly localeId: string }>(
  'settings.setLocale',
  {
    label: 'Set locale',
    description: 'Request the DOGFOOD locale selection to change.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'SettingsMenuBlock' }],
  },
);

export const settingsSetShellThemeIntent = commandIntent<{ readonly themeId: string }>(
  'settings.setShellTheme',
  {
    label: 'Set shell theme',
    description: 'Request a frame shell theme change.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'SettingsMenuBlock' }],
  },
);

export const settingsMenuBlock: BlockDefinition<SettingsMenuBlockConfig, string> = defineBlock({
  metadata: {
    packageName: DOGFOOD_BLOCK_PACKAGE,
    blockName: 'SettingsMenuBlock',
    family: 'dogfood-settings',
    scale: 'panel',
    modes: DOGFOOD_BLOCK_MODES,
    docs: {
      summary: 'Owns the semantic settings menu contract for locale, theme, and app preferences.',
      useWhen: ['DOGFOOD needs an inspectable settings surface with command intents.'],
      avoidWhen: ['A frame shell only needs the lower-level settings drawer renderer.'],
      relatedDocs: ['docs/DOGFOOD.md'],
    },
    sourcePath: 'examples/docs/app.ts',
    slots: [
      { id: 'sections', required: true, description: 'Settings groups and rows.' },
      { id: 'selection', required: false, description: 'Focused or active setting row.' },
    ],
    variants: [
      {
        id: 'drawer',
        label: 'Drawer',
        requiredSlots: ['sections'],
        optionalSlots: ['selection'],
        facts: [{ kind: 'state', key: 'dogfood.settings.surface', value: 'drawer' }],
      },
    ],
    composedComponents: ['createFramedApp() settings', 'preferenceListSurface()'],
    semanticFacts: [{ kind: 'entity', key: 'dogfood.block', value: 'SettingsMenuBlock' }],
    storyIds: ['settings-menu.drawer'],
    examples: [{ id: 'dogfood.settings', label: 'DOGFOOD settings menu' }],
    tags: ['dogfood', 'settings', 'locale', 'theme'],
  },
  data: settingsMenuData,
  commands: [
    settingsActivateRowIntent,
    settingsSetLocaleIntent,
    settingsSetShellThemeIntent,
  ],
  render: renderSettingsMenuBlock,
});
