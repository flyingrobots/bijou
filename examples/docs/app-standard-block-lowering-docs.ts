import { standardBlocks } from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { formatDocsList } from './app-standard-block-docs-format.js';
import { standardBlockPreviewText as dogfoodText } from './app-standard-block-preview-text.js';

export function standardBlockLoweringMarkdown(localization?: LocalizationPort): string {
  const declaredModes = Array.from(
    new Set(standardBlocks.flatMap((block) => block.metadata.modes)),
  ).sort();
  const blockIndex = standardBlocks
    .map((block) => `- ${block.metadata.blockName}`)
    .join('\n');
  const blockRows = standardBlocks.map((block) => {
    const metadata = block.metadata;
    const semanticFacts = (metadata.semanticFacts ?? [])
      .map((fact) => `${fact.kind}:${fact.key}=${String(fact.value ?? '')}`);
    const variantFacts = (metadata.variants ?? [])
      .flatMap((variant) => variant.facts ?? [])
      .map((fact) => `${fact.kind}:${fact.key}=${String(fact.value ?? '')}`);

    return [
      `## ${metadata.blockName}`,
      '',
      `- Modes: ${metadata.modes.join(', ')}`,
      `- Semantic facts: ${formatDocsList(semanticFacts)}`,
      `- Variant facts: ${formatDocsList(variantFacts)}`,
    ].join('\n');
  }).join('\n\n');

  return [
    '# How Blocks Lower',
    '',
    'Blocks lower by preserving declared modes, semantic facts, story states, data requirements, and command intents as inspectable contract data before rendered output exists.',
    '',
    `Declared modes: ${declaredModes.join(', ')}`,
    '',
    `## ${dogfoodText(localization, 'blocks.standard.catalogTitle', 'Catalog')}`,
    '',
    blockIndex,
    '',
    `## ${dogfoodText(localization, 'blocks.standard.detailsTitle', 'Details')}`,
    '',
    blockRows,
  ].join('\n');
}
