import { commandIntent, defineDataRequirement, defineViewData } from '../binding.js';

import type { StandardBlockName } from './types.js';
export interface StandardBlockDataRequirementInput {
  readonly name: string;
  readonly label: string;
  readonly description: string;
  readonly optional?: boolean;
}
export function standardBlockData(
  blockKey: string,
  blockName: StandardBlockName,
  requirements: readonly StandardBlockDataRequirementInput[],
) {
  return defineViewData({
    id: `${blockKey}.data`,
    label: `${blockName} data`,
    description: `Boundary data required to render ${blockName}.`,
    requirements: requirements.map((requirement) => ({
      name: requirement.name,
      requirement: defineDataRequirement({
        id: `${blockKey}.${requirement.name}`,
        resource: `blocks.${blockKey}.${requirement.name}`,
        label: requirement.label,
        description: requirement.description,
        optional: requirement.optional,
        facts: [{ kind: 'entity', key: 'block.data', value: blockName }],
      }),
    })),
  });
}
export function standardSectionCommands(blockName: StandardBlockName) {
  const prefix = commandPrefix(blockName);
  return Object.freeze([
    commandIntent(`${prefix}.select`, {
      label: 'Select',
      description: `Request focus for ${blockName}.`,
      facts: [{ kind: 'entity', key: 'block.command', value: blockName }],
    }),
    commandIntent(`${prefix}.copyFacts`, {
      label: 'Copy facts',
      description: `Copy semantic facts from ${blockName}.`,
      facts: [{ kind: 'entity', key: 'block.command', value: blockName }],
    }),
    commandIntent(`${prefix}.openStory`, {
      label: 'Open story',
      description: `Open the DOGFOOD story for ${blockName}.`,
      facts: [{ kind: 'entity', key: 'block.command', value: blockName }],
    }),
  ]);
}
export function commandPrefix(blockName: StandardBlockName): string {
  const withoutBlock = blockName.replace(/Block$/, '');
  return withoutBlock.charAt(0).toLowerCase() + withoutBlock.slice(1);
}
export function standardBlockKey(blockName: StandardBlockName): string {
  return blockName
    .replace(/Block$/, '')
    .replace(
      /[A-Z]/g,
      (letter, index) => `${index === 0 ? '' : '-'}${letter.toLowerCase()}`,
    );
}
export const shellFocusRegion = commandIntent<{ readonly region: string }>('shell.focusRegion', {
  label: 'Focus region',
  description: 'Move focus to a named AppShell region.',
  facts: [{ kind: 'entity', key: 'block.command', value: 'AppShell' }],
});
export const shellToggleInspector = commandIntent('shell.toggleInspector', {
  label: 'Toggle inspector',
  description: 'Request inspector visibility change.',
  facts: [{ kind: 'entity', key: 'block.command', value: 'AppShell' }],
});
export const shellOpenOverlay = commandIntent<{ readonly overlayId: string }>('shell.openOverlay', {
  label: 'Open overlay',
  description: 'Request a shell overlay by id.',
  facts: [{ kind: 'entity', key: 'block.command', value: 'AppShell' }],
});
export const readerArticleRequirement = defineDataRequirement({
  id: 'reader.article',
  resource: 'reader.article',
  label: 'Article',
  description: 'Primary readable article content.',
  facts: [{ kind: 'entity', key: 'block.data', value: 'ReaderSurface' }],
});
export const readerOutlineRequirement = defineDataRequirement({
  id: 'reader.outline',
  resource: 'reader.outline',
  label: 'Outline',
  description: 'Optional article outline for navigation.',
  optional: true,
  facts: [{ kind: 'entity', key: 'block.data', value: 'ReaderSurface' }],
});
