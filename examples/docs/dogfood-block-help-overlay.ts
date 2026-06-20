import { commandIntent, defineBlock, defineDataRequirement, defineViewData } from '@flyingrobots/bijou';
import type { BlockDefinition, BlockRenderInput, BlockRenderResult } from '@flyingrobots/bijou';
import { DOGFOOD_BLOCK_MODES, DOGFOOD_BLOCK_PACKAGE, s } from './dogfood-block-common.js';

export interface HelpOverlayBlockConfig {
  readonly bindingCount?: number;
  readonly scopeLabel?: string;
}

export const helpBindingsRequirement = defineDataRequirement({
  id: 'help.bindings',
  resource: 'dogfood.help.bindings',
  label: 'Help bindings',
  description: 'Keyboard bindings visible in the DOGFOOD help overlay.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'HelpOverlayBlock' }],
});

export const helpScopeRequirement = defineDataRequirement({
  id: 'help.scope',
  resource: 'dogfood.help.scope',
  label: 'Help scope',
  description: 'Active page or layer scope for DOGFOOD keyboard guidance.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'HelpOverlayBlock' }],
});

export const helpOverlayData = defineViewData({
  id: 'help-overlay.data',
  label: 'HelpOverlayBlock data',
  description: 'DOGFOOD keyboard help bindings and active scope.',
  requirements: [
    { name: 'bindings', requirement: helpBindingsRequirement },
    { name: 'scope', requirement: helpScopeRequirement },
  ],
});

export const helpDismissIntent = commandIntent('help.dismiss', {
  label: 'Dismiss help',
  description: 'Request closing the DOGFOOD keyboard help overlay.',
  facts: [{ kind: 'entity', key: 'dogfood.command', value: 'HelpOverlayBlock' }],
});

export const helpOverlayBlock: BlockDefinition<HelpOverlayBlockConfig, string> = defineBlock({
  metadata: {
    packageName: DOGFOOD_BLOCK_PACKAGE,
    blockName: 'HelpOverlayBlock',
    family: 'dogfood-help',
    scale: 'panel',
    modes: DOGFOOD_BLOCK_MODES,
    docs: {
      summary: 'Owns the DOGFOOD keyboard help overlay contract.',
      useWhen: ['DOGFOOD needs page- or layer-scoped keyboard guidance.'],
      avoidWhen: ['A surface only needs a single footer hint line.'],
      relatedDocs: ['docs/DOGFOOD.md'],
    },
    sourcePath: 'packages/bijou-tui/src/app-frame.ts',
    slots: [
      { id: 'bindings', required: true, description: 'Visible keyboard bindings.' },
      { id: 'scope', required: true, description: 'Active help scope.' },
    ],
    variants: [
      {
        id: 'overlay',
        label: 'Overlay',
        requiredSlots: ['bindings', 'scope'],
        facts: [{ kind: 'state', key: 'dogfood.help.surface', value: 'overlay' }],
      },
    ],
    composedComponents: ['renderHelpOverlay()', 'modal()'],
    semanticFacts: [{ kind: 'entity', key: 'dogfood.block', value: 'HelpOverlayBlock' }],
    storyIds: ['help-overlay.overlay'],
    examples: [{ id: 'dogfood.help', label: 'DOGFOOD keyboard help' }],
    tags: ['dogfood', 'help', 'frame'],
  },
  data: helpOverlayData,
  commands: [helpDismissIntent],
  render: renderHelpOverlayBlock,
});

function renderHelpOverlayBlock(
  input: BlockRenderInput<HelpOverlayBlockConfig>,
): BlockRenderResult<string> {
  const bindingCount = input.config?.bindingCount ?? 0;
  const scopeLabel = input.config?.scopeLabel ?? 'workspace';

  if (input.mode === 'pipe' || input.mode === 'accessible') {
    return {
      output: `Help scope: ${scopeLabel}; bindings: ${s(bindingCount)}`,
      facts: [
        { kind: 'entity', key: 'dogfood.block', value: 'HelpOverlayBlock' },
        { kind: 'state', key: 'dogfood.help.bindingCount', value: s(bindingCount) },
      ],
    };
  }

  return {
    output: [
      'HelpOverlayBlock',
      `scope: ${scopeLabel}`,
      `bindings: ${s(bindingCount)}`,
      'Intents: dismiss help',
    ].join('\n'),
    facts: [
      { kind: 'entity', key: 'dogfood.block', value: 'HelpOverlayBlock' },
      { kind: 'state', key: 'dogfood.help.bindingCount', value: s(bindingCount) },
    ],
  };
}
