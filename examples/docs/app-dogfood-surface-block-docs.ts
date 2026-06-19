import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { standardBlockPreviewText as dogfoodText } from './app-standard-block-preview-text.js';
import {
  defaultDogfoodBlockRegistry,
  dogfoodDocsSurfacePreviewOutput,
  type DogfoodBlockRegistryEntry,
} from './dogfood-blocks.js';

export function dogfoodSurfaceBlockInventoryMarkdown(localization?: LocalizationPort): string {
  const entries = defaultDogfoodBlockRegistry.entries();
  const surfaceIndex = entries
    .map((entry) => `- ${entry.blockName} -> ${entry.surfaceId} (${entry.role})`)
    .join('\n');
  const blockSections = entries.map((entry) => {
    const metadata = entry.block.metadata;
    const dataNames = entry.block.data?.names() ?? [];
    const commandIds = entry.block.commands?.map((command) => command.id) ?? [];

    return [
      `## ${metadata.blockName}`,
      '',
      dogfoodSurfaceBlockDescription(entry, localization),
      '',
      `- ${dogfoodText(localization, 'blocks.surfaceInventory.label.surface', 'Surface')}: ${entry.surfaceId}`,
      `- ${dogfoodText(localization, 'blocks.surfaceInventory.label.role', 'Role')}: ${entry.role}`,
      `- ${dogfoodText(localization, 'blocks.surfaceInventory.label.family', 'Family')}: ${metadata.family}`,
      `- ${dogfoodText(localization, 'blocks.surfaceInventory.label.scale', 'Scale')}: ${metadata.scale}`,
      `- ${dogfoodText(localization, 'blocks.surfaceInventory.label.modes', 'Modes')}: ${metadata.modes.join(', ')}`,
      `- ${dogfoodText(localization, 'blocks.surfaceInventory.label.dataRequirements', 'Data requirements')}: ${formatDocsList(dataNames)}`,
      `- ${dogfoodText(localization, 'blocks.surfaceInventory.label.commandIntents', 'Command intents')}: ${formatDocsList(commandIds)}`,
      `- ${dogfoodText(localization, 'blocks.surfaceInventory.label.tags', 'Tags')}: ${formatDocsList(entry.tags)}`,
      ...dogfoodSurfaceBlockPreviewMarkdown(entry, localization),
    ].join('\n');
  }).join('\n\n');

  return [
    `# ${dogfoodText(localization, 'blocks.surfaceInventory.title', 'DOGFOOD Surface Blocks')}`,
    '',
    dogfoodText(
      localization,
      'blocks.surfaceInventory.count',
      'DOGFOOD currently registers {count} semantic product surface Blocks.',
      { count: entries.length },
    ),
    '',
    dogfoodText(
      localization,
      'blocks.surfaceInventory.description',
      'These Blocks describe visible DOGFOOD app surfaces. They are local DOGFOOD contracts, not automatically promoted first-party standard Blocks.',
    ),
    '',
    `## ${dogfoodText(localization, 'blocks.surfaceInventory.surfaceIndexTitle', 'Surface index')}`,
    '',
    surfaceIndex,
    '',
    `## ${dogfoodText(localization, 'blocks.surfaceInventory.surfaceDetailsTitle', 'Surface details')}`,
    '',
    blockSections,
  ].join('\n');
}

function dogfoodSurfaceBlockPreviewMarkdown(
  entry: DogfoodBlockRegistryEntry,
  localization?: LocalizationPort,
): readonly string[] {
  if (entry.surfaceId !== 'docs.surface') return [];

  return [
    '',
    `### ${dogfoodText(localization, 'blocks.surfaceInventory.renderedPreview', 'Rendered preview')}`,
    '',
    '```',
    dogfoodDocsSurfacePreviewOutput(),
    '```',
  ];
}

function dogfoodSurfaceBlockDescription(
  entry: DogfoodBlockRegistryEntry,
  localization?: LocalizationPort,
): string {
  const fallback = entry.description ?? entry.block.metadata.docs.summary;
  return dogfoodText(
    localization,
    `blocks.surfaceInventory.entry.${entry.surfaceId}.description`,
    fallback,
  );
}

function formatDocsList(values: readonly string[]): string {
  return values.length === 0 ? '-' : values.join(', ');
}
