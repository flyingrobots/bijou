import {
  standardBlockStories,
  type BlockDefinition,
} from '../../packages/bijou/src/index.js';
import { formatDocsList } from './app-standard-block-docs-format.js';

export function standardBlockDocumentationText(block: BlockDefinition): string {
  const metadata = block.metadata;
  const stories = standardBlockStories.filter((story) => story.blockName === metadata.blockName);
  const slots = metadata.slots.map((slot) => `${slot.id}${slot.required === true ? ' required' : ' optional'}`);
  const variants = (metadata.variants ?? []).map((variant) => `${variant.id} (${variant.label})`);
  const dataNames = block.data?.names() ?? [];
  const commands = block.commands?.map((command) => command.id) ?? [];

  return [
    metadata.docs.summary,
    `Family: ${metadata.family}`,
    `Scale: ${metadata.scale}`,
    `Modes: ${formatDocsList(metadata.modes)}`,
    `Slots: ${formatDocsList(slots)}`,
    `Variants: ${formatDocsList(variants)}`,
    `Data requirements: ${formatDocsList(dataNames)}`,
    `Command intents: ${formatDocsList(commands)}`,
    `Stories: ${formatDocsList(stories.map((story) => `${story.id} (${story.state})`))}`,
  ].join('\n');
}
