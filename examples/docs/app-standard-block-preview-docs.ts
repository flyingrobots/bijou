import {
  standardBlocks,
  standardBlockStories,
  type StandardBlockStory,
} from '../../packages/bijou/src/index.js';
import { formatDocsList } from './app-standard-block-docs-format.js';

export function standardBlockPreviewMarkdown(): string {
  const storiesByBlock = new Map<string, StandardBlockStory[]>();
  for (const story of standardBlockStories) {
    const existing = storiesByBlock.get(story.blockName) ?? [];
    storiesByBlock.set(story.blockName, [...existing, story]);
  }

  const blockSections = standardBlocks.map((block) => {
    const metadata = block.metadata;
    const variants = metadata.variants ?? [];
    const stories = storiesByBlock.get(metadata.blockName) ?? [];

    return [
      `## ${metadata.blockName}`,
      '',
      metadata.docs.summary,
      '',
      `Variants: ${formatDocsList(variants.map((variant) => `${variant.id} (${variant.label})`))}`,
      '',
      'Stories:',
      stories.map((story) => `- ${story.id} - ${story.label} - ${story.state}`).join('\n'),
    ].join('\n');
  }).join('\n\n');

  return [
    '# Block Preview',
    '',
    'Select a block in the side navigation to see its live TUI example, lowering preview, and documentation. The overview keeps the package inventory readable without rendering every block at once.',
    '',
    '## Available Blocks',
    '',
    blockSections,
  ].join('\n');
}
