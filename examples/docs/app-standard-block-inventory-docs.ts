import { standardBlocks } from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { formatDocsList, standardBlockCatalogIndexMarkdown } from './app-standard-block-docs-format.js';
import { standardBlockPreviewText as dogfoodText } from './app-standard-block-preview-text.js';

export function standardBlockInventoryMarkdown(localization?: LocalizationPort): string {
  const blockIndex = standardBlockCatalogIndexMarkdown();
  const blockSections = standardBlocks.map((block) => {
    const metadata = block.metadata;
    const requiredSlots = metadata.slots.filter((slot) => slot.required === true).map((slot) => slot.id);
    const optionalSlots = metadata.slots.filter((slot) => slot.required !== true).map((slot) => slot.id);
    const dataNames = block.data?.names() ?? [];
    const commandIds = block.commands?.map((command) => command.id) ?? [];

    return [
      `## ${metadata.blockName}`,
      '',
      metadata.docs.summary,
      '',
      `- Family: ${metadata.family}`,
      `- Scale: ${metadata.scale}`,
      `- Modes: ${metadata.modes.join(', ')}`,
      `- Required slots: ${formatDocsList(requiredSlots)}`,
      `- Optional slots: ${formatDocsList(optionalSlots)}`,
      `- Data requirements: ${formatDocsList(dataNames)}`,
      `- Command intents: ${formatDocsList(commandIds)}`,
    ].join('\n');
  }).join('\n\n');

  return [
    '# Pre-made Blocks',
    '',
    `First-party standard blocks shipped by @flyingrobots/bijou: ${String(standardBlocks.length)}.`,
    '',
    'These are public block authoring contracts with semantic slots, declared modes, data requirements, command intents, variants, and stories. Select a block under Block Preview for the live rendered example.',
    '',
    `## ${dogfoodText(localization, 'blocks.standard.catalogTitle', 'Catalog')}`,
    '',
    blockIndex,
    '',
    `## ${dogfoodText(localization, 'blocks.standard.detailsTitle', 'Details')}`,
    '',
    blockSections,
  ].join('\n');
}
