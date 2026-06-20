import { commandIntent, defineBlock, defineDataRequirement, defineViewData } from '@flyingrobots/bijou';
import type { BlockDefinition, BlockRenderInput, BlockRenderResult } from '@flyingrobots/bijou';
import { DOGFOOD_BLOCK_MODES, DOGFOOD_BLOCK_PACKAGE, s } from './dogfood-block-common.js';

const COMMAND_PALETTE_BLOCK_NAME = 'CommandPaletteBlock';

export interface CommandPaletteBlockConfig {
  readonly commandCount?: number;
  readonly activeCommandLabel?: string;
}

export const commandPaletteCommandsRequirement = defineDataRequirement({
  id: 'command-palette.commands',
  resource: 'dogfood.commandPalette.commands',
  label: 'Command palette commands',
  description: 'Frame-owned DOGFOOD command palette items.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: COMMAND_PALETTE_BLOCK_NAME }],
});

export const commandPaletteSelectionRequirement = defineDataRequirement({
  id: 'command-palette.selection',
  resource: 'dogfood.commandPalette.selection',
  label: 'Command palette selection',
  description: 'Focused DOGFOOD command palette item.',
  optional: true,
  facts: [{ kind: 'entity', key: 'dogfood.block', value: COMMAND_PALETTE_BLOCK_NAME }],
});

export const commandPaletteData = defineViewData({
  id: 'command-palette.data',
  label: 'CommandPaletteBlock data',
  description: 'DOGFOOD command palette items and active command selection.',
  requirements: [
    { name: 'commands', requirement: commandPaletteCommandsRequirement },
    { name: 'selection', requirement: commandPaletteSelectionRequirement },
  ],
});

export const commandPaletteExecuteIntent = commandIntent<{ readonly commandId: string }>(
  'commandPalette.execute',
  {
    label: 'Execute command',
    description: 'Request execution of the selected DOGFOOD command palette item.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: COMMAND_PALETTE_BLOCK_NAME }],
  },
);

export const commandPaletteDismissIntent = commandIntent('commandPalette.dismiss', {
  label: 'Dismiss command palette',
  description: 'Request closing the DOGFOOD command palette.',
  facts: [{ kind: 'entity', key: 'dogfood.command', value: COMMAND_PALETTE_BLOCK_NAME }],
});

export const commandPaletteBlock: BlockDefinition<CommandPaletteBlockConfig, string> = defineBlock({
  metadata: {
    packageName: DOGFOOD_BLOCK_PACKAGE,
    blockName: COMMAND_PALETTE_BLOCK_NAME,
    family: 'dogfood-commands',
    scale: 'panel',
    modes: DOGFOOD_BLOCK_MODES,
    docs: {
      summary: 'Owns the DOGFOOD command palette contract for global command discovery.',
      useWhen: ['DOGFOOD needs inspectable global commands and command execution intents.'],
      avoidWhen: ['A page only needs a local inline action row.'],
      relatedDocs: ['docs/DOGFOOD.md'],
    },
    sourcePath: 'packages/bijou-tui/src/app-frame.ts',
    slots: [
      { id: 'commands', required: true, description: 'Available command rows.' },
      { id: 'selection', required: false, description: 'Focused command row.' },
    ],
    variants: [
      {
        id: 'palette',
        label: 'Palette',
        requiredSlots: ['commands'],
        optionalSlots: ['selection'],
        facts: [{ kind: 'state', key: 'dogfood.commandPalette.surface', value: 'palette' }],
      },
    ],
    composedComponents: ['commandPaletteSurface()', 'modal()'],
    semanticFacts: [{ kind: 'entity', key: 'dogfood.block', value: COMMAND_PALETTE_BLOCK_NAME }],
    storyIds: ['command-palette.palette'],
    examples: [{ id: 'dogfood.commandPalette', label: 'DOGFOOD command palette' }],
    tags: ['dogfood', 'commands', 'frame'],
  },
  data: commandPaletteData,
  commands: [
    commandPaletteExecuteIntent,
    commandPaletteDismissIntent,
  ],
  render: renderCommandPaletteBlock,
});

function renderCommandPaletteBlock(
  input: BlockRenderInput<CommandPaletteBlockConfig>,
): BlockRenderResult<string> {
  const commandCount = input.config?.commandCount ?? 0;
  const activeCommandLabel = input.config?.activeCommandLabel ?? 'none';

  if (input.mode === 'pipe' || input.mode === 'accessible') {
    return {
      output: `Command palette commands: ${s(commandCount)}; active: ${activeCommandLabel}`,
      facts: [
        { kind: 'entity', key: 'dogfood.block', value: COMMAND_PALETTE_BLOCK_NAME },
        { kind: 'state', key: 'dogfood.commandPalette.commandCount', value: s(commandCount) },
      ],
    };
  }

  return {
    output: [
      'CommandPaletteBlock',
      `commands: ${s(commandCount)}`,
      `active: ${activeCommandLabel}`,
      'Intents: execute command; dismiss command palette',
    ].join('\n'),
    facts: [
      { kind: 'entity', key: 'dogfood.block', value: COMMAND_PALETTE_BLOCK_NAME },
      { kind: 'state', key: 'dogfood.commandPalette.commandCount', value: s(commandCount) },
    ],
  };
}
