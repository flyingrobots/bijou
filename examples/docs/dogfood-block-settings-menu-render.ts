import type { BlockRenderInput, BlockRenderResult } from '@flyingrobots/bijou';
import { s } from './dogfood-block-common.js';
import type { SettingsMenuBlockConfig, SettingsMenuBlockRow } from './dogfood-block-settings-menu.js';

function renderSettingsMenuRow(row: SettingsMenuBlockRow): readonly string[] {
  const value = row.valueLabel == null ? '' : `: ${row.valueLabel}`;
  const summary = `- ${row.label}${value}`;
  return row.description == null ? [summary] : [summary, `  ${row.description}`];
}

export function renderSettingsMenuBlock(
  input: BlockRenderInput<SettingsMenuBlockConfig>,
): BlockRenderResult<string> {
  const sections = input.config?.sections ?? [];
  const sectionCount = input.config?.sectionCount ?? sections.length;
  const activeSettingLabel = input.config?.activeSettingLabel
    ?? sections.find((section) => section.rows.length > 0)?.rows[0]?.label
    ?? 'none';

  if (input.mode === 'pipe' || input.mode === 'accessible') {
    if (sections.length > 0) {
      return {
        output: sections.flatMap((section) => [
          section.title,
          ...section.rows.flatMap(renderSettingsMenuRow),
        ]).join('\n'),
        facts: [{ kind: 'entity', key: 'dogfood.block', value: 'SettingsMenuBlock' }],
      };
    }

    return {
      output: `Settings sections: ${s(sectionCount)}; active: ${activeSettingLabel}`,
      facts: [{ kind: 'entity', key: 'dogfood.block', value: 'SettingsMenuBlock' }],
    };
  }

  if (sections.length > 0) {
    return {
      output: [
        'SettingsMenuBlock',
        ...sections.flatMap((section) => [
          section.title,
          ...section.rows.flatMap(renderSettingsMenuRow),
        ]),
      ].join('\n'),
      facts: [{ kind: 'entity', key: 'dogfood.block', value: 'SettingsMenuBlock' }],
    };
  }

  return {
    output: [
      'SettingsMenuBlock',
      `sections: ${s(sectionCount)}`,
      `active: ${activeSettingLabel}`,
      'Intents: activate row; set locale; set shell theme',
    ].join('\n'),
    facts: [{ kind: 'entity', key: 'dogfood.block', value: 'SettingsMenuBlock' }],
  };
}
