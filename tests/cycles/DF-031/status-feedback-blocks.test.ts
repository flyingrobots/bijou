import { describe, expect, it } from 'vitest';
import {
  activityStreamBlock,
  activityStreamSchemaBlock,
  bindSchemaBlockInput,
  inFlowStatusBlock,
  inFlowStatusSchemaBlock,
  inlineStatusBlock,
  inlineStatusSchemaBlock,
  isSchemaBoundBlockDefinition,
  lintModeLowering,
  progressIndicatorBlock,
  progressIndicatorSchemaBlock,
  shortcutCueBlock,
  shortcutCueSchemaBlock,
  standardBlockPackageManifest,
  standardBlocks,
  transientOverlayBlock,
  transientOverlaySchemaBlock,
  validateBlockMetadata,
} from '../../../packages/bijou/src/index.js';

const STATUS_FEEDBACK_BLOCKS = [
  inlineStatusBlock,
  inFlowStatusBlock,
  transientOverlayBlock,
  activityStreamBlock,
  shortcutCueBlock,
  progressIndicatorBlock,
] as const;

const STATUS_FEEDBACK_SCHEMA_BLOCKS = [
  {
    block: inlineStatusBlock,
    schemaBlock: inlineStatusSchemaBlock,
    bind: (input: unknown) => bindSchemaBlockInput(inlineStatusSchemaBlock, input),
    valid: { label: 'docs', status: 'ok', message: 'synced' },
    invalid: { label: 'docs' },
    requiredFields: ['label', 'status'],
    optionalFields: ['message'],
    expectedSlots: { label: 'docs', status: 'ok', message: 'synced' },
  },
  {
    block: inFlowStatusBlock,
    schemaBlock: inFlowStatusSchemaBlock,
    bind: (input: unknown) => bindSchemaBlockInput(inFlowStatusSchemaBlock, input),
    valid: {
      severity: 'warning',
      source: 'docs',
      message: 'inventory stale',
      action: 'run docs:inventory',
    },
    invalid: { severity: 'warning' },
    requiredFields: ['severity', 'message'],
    optionalFields: ['source', 'action'],
    expectedSlots: {
      severity: 'warning',
      source: 'docs',
      message: 'inventory stale',
      action: 'run docs:inventory',
    },
  },
  {
    block: transientOverlayBlock,
    schemaBlock: transientOverlaySchemaBlock,
    bind: (input: unknown) => bindSchemaBlockInput(transientOverlaySchemaBlock, input),
    valid: {
      priority: 'normal',
      message: 'Saved DOGFOOD route',
      dismiss: 'Esc dismisses',
    },
    invalid: { priority: 'normal' },
    requiredFields: ['message'],
    optionalFields: ['priority', 'dismiss'],
    expectedSlots: {
      priority: 'normal',
      message: 'Saved DOGFOOD route',
      dismiss: 'Esc dismisses',
    },
  },
  {
    block: activityStreamBlock,
    schemaBlock: activityStreamSchemaBlock,
    bind: (input: unknown) => bindSchemaBlockInput(activityStreamSchemaBlock, input),
    valid: {
      events: ['10:41 tests passed', '10:42 PR opened'],
      selected: '10:41 tests passed',
    },
    invalid: { events: '10:41 tests passed' },
    requiredFields: ['events'],
    optionalFields: ['selected'],
    expectedSlots: {
      events: ['10:41 tests passed', '10:42 PR opened'],
      selected: '10:41 tests passed',
    },
  },
  {
    block: shortcutCueBlock,
    schemaBlock: shortcutCueSchemaBlock,
    bind: (input: unknown) => bindSchemaBlockInput(shortcutCueSchemaBlock, input),
    valid: { shortcuts: ['/ Search', '? Help', 'Esc Close'], scope: 'page' },
    invalid: { scope: 'page' },
    requiredFields: ['shortcuts'],
    optionalFields: ['scope'],
    expectedSlots: { shortcuts: ['/ Search', '? Help', 'Esc Close'], scope: 'page' },
  },
  {
    block: progressIndicatorBlock,
    schemaBlock: progressIndicatorSchemaBlock,
    bind: (input: unknown) => bindSchemaBlockInput(progressIndicatorSchemaBlock, input),
    valid: { label: 'Install packages', value: 3, total: 5, percent: '60%' },
    invalid: { label: 'Install packages', value: 3 },
    requiredFields: ['label', 'percent'],
    optionalFields: ['value', 'total'],
    expectedSlots: { label: 'Install packages', value: 3, total: 5, percent: '60%' },
  },
] as const;

describe('DF-031 to DF-038 status and feedback Blocks', () => {
  it('publishes the status and feedback block slice through the standard catalog', () => {
    expect(STATUS_FEEDBACK_BLOCKS.map((block) => block.metadata.blockName)).toEqual([
      'InlineStatusBlock',
      'InFlowStatusBlock',
      'TransientOverlayBlock',
      'ActivityStreamBlock',
      'ShortcutCueBlock',
      'ProgressIndicatorBlock',
    ]);

    for (const block of STATUS_FEEDBACK_BLOCKS) {
      expect(validateBlockMetadata(block.metadata).passed).toBe(true);
      expect(block.metadata.modes).toEqual([
        'interactive',
        'static',
        'pipe',
        'accessible',
      ]);
      expect(block.metadata.storyIds ?? []).toContain(
        `${storyPrefix(block.metadata.blockName)}.ready`,
      );
      expect(block.data?.names()).not.toHaveLength(0);
      expect(block.commands?.map((command) => command.id)).toEqual([
        `${commandPrefix(block.metadata.blockName)}.select`,
        `${commandPrefix(block.metadata.blockName)}.copyFacts`,
        `${commandPrefix(block.metadata.blockName)}.openStory`,
      ]);
    }

    expect(standardBlocks).toEqual(expect.arrayContaining([...STATUS_FEEDBACK_BLOCKS]));
    expect(standardBlockPackageManifest.blocks).toEqual(expect.arrayContaining([
      'InlineStatusBlock',
      'InFlowStatusBlock',
      'TransientOverlayBlock',
      'ActivityStreamBlock',
      'ShortcutCueBlock',
      'ProgressIndicatorBlock',
    ]));
  });

  it('renders each feedback block across visual and lower modes', () => {
    for (const block of STATUS_FEEDBACK_BLOCKS) {
      const slots = slotsFor(block.metadata.blockName);
      const interactive = block.render({ mode: 'interactive', slots, config: { width: 56 } });
      const staticOutput = block.render({ mode: 'static', slots, config: { width: 56 } });
      const pipe = block.render({ mode: 'pipe', slots });
      const accessible = block.render({ mode: 'accessible', slots });

      expect(typeof interactive.output).toBe('object');
      expect(typeof staticOutput.output).toBe('object');
      expect(String(pipe.output)).toContain(block.metadata.blockName);
      expect(String(accessible.output)).toContain(block.metadata.blockName);
      expect(String(pipe.output)).toContain(expectedNeedle(block.metadata.blockName));
      expect(String(accessible.output)).toContain(expectedNeedle(block.metadata.blockName));
    }
  });

  it('binds schema-validated feedback data to render slots', () => {
    for (const spec of STATUS_FEEDBACK_SCHEMA_BLOCKS) {
      expect(isSchemaBoundBlockDefinition(spec.schemaBlock)).toBe(true);
      expect(spec.schemaBlock.block).toBe(spec.block);
      expect(spec.schemaBlock.schema.describe?.()).toMatchObject({
        requiredFields: spec.requiredFields,
        optionalFields: spec.optionalFields,
        facts: [{ kind: 'entity', key: 'block.schema', value: spec.block.metadata.blockName }],
      });

      const bound = spec.bind(spec.valid);
      expect(bound).toMatchObject({
        ok: true,
        input: { slots: spec.expectedSlots },
      });
      expect(bound.facts).toEqual(expect.arrayContaining([
        { kind: 'entity', key: 'block.schema', value: spec.block.metadata.blockName },
      ]));

      expect(spec.bind(spec.invalid)).toMatchObject({
        ok: false,
        issues: [{
          severity: 'error',
          code: `${storyPrefix(spec.block.metadata.blockName)}.data.invalid`,
        }],
      });
    }
  });

  it('rejects feedback schema accessors without invoking them', () => {
    let getterCalls = 0;
    const accessorStatus = Object.defineProperties({}, {
      label: {
        enumerable: true,
        get() {
          getterCalls += 1;
          return 'docs';
        },
      },
      status: {
        enumerable: true,
        get() {
          getterCalls += 1;
          return 'ok';
        },
      },
    });

    expect(bindSchemaBlockInput(inlineStatusSchemaBlock, accessorStatus)).toMatchObject({
      ok: false,
    });
    expect(getterCalls).toBe(0);
  });

  it('preserves required semantic facts in lowerings for the slice', () => {
    for (const block of STATUS_FEEDBACK_BLOCKS) {
      const slots = slotsFor(block.metadata.blockName);
      const report = lintModeLowering({
        modes: block.metadata.modes.map((mode) => ({
          mode,
          facts: block.render({ mode, slots }).facts ?? [],
        })),
      });

      expect(report, block.metadata.blockName).toMatchObject({ passed: true });
      expect(block.render({ mode: 'pipe', slots }).facts).toEqual(expect.arrayContaining([
        { kind: 'entity', key: 'block', value: block.metadata.blockName },
        { kind: 'state', key: 'block.rendered', value: true },
        { kind: 'entity', key: 'block.family', value: block.metadata.family },
        { kind: 'state', key: 'block.variant', value: 'ready' },
        { kind: 'state', key: 'block.mode', value: 'pipe', required: false },
        {
          kind: 'label',
          key: `semanticValue.${primarySemanticSlot(block.metadata.blockName)}`,
          value: primarySemanticValue(block.metadata.blockName),
        },
      ]));
    }

    expect(activityStreamBlock.render({
      mode: 'pipe',
      slots: slotsFor('ActivityStreamBlock'),
    }).facts).toContainEqual({
      kind: 'entity',
      key: 'block.selected',
      value: '10:41 tests passed',
    });
  });
});

function storyPrefix(blockName: string): string {
  return blockName
    .replace(/Block$/, '')
    .replace(
      /[A-Z]/g,
      (letter, index) => `${index === 0 ? '' : '-'}${letter.toLowerCase()}`,
    );
}

function commandPrefix(blockName: string): string {
  const withoutBlock = blockName.replace(/Block$/, '');
  return withoutBlock.charAt(0).toLowerCase() + withoutBlock.slice(1);
}

function slotsFor(blockName: string): Readonly<Record<string, unknown>> {
  switch (blockName) {
    case 'InlineStatusBlock':
      return { label: 'docs', status: 'ok', message: 'synced' };
    case 'InFlowStatusBlock':
      return {
        severity: 'warning',
        source: 'docs',
        message: 'inventory stale',
        action: 'run docs:inventory',
      };
    case 'TransientOverlayBlock':
      return {
        priority: 'normal',
        message: 'Saved DOGFOOD route',
        dismiss: 'Esc dismisses',
      };
    case 'ActivityStreamBlock':
      return {
        events: ['10:41 tests passed', '10:42 PR opened'],
        selected: '10:41 tests passed',
      };
    case 'ShortcutCueBlock':
      return { shortcuts: ['/ Search', '? Help', 'Esc Close'], scope: 'page' };
    case 'ProgressIndicatorBlock':
      return { label: 'Install packages', value: '3', total: '5', percent: '60%' };
    default:
      throw new Error(`missing slots for ${blockName}`);
  }
}

function expectedNeedle(blockName: string): string {
  switch (blockName) {
    case 'InlineStatusBlock':
      return 'docs';
    case 'InFlowStatusBlock':
      return 'inventory stale';
    case 'TransientOverlayBlock':
      return 'Saved DOGFOOD route';
    case 'ActivityStreamBlock':
      return '10:41 tests passed';
    case 'ShortcutCueBlock':
      return '/ Search';
    case 'ProgressIndicatorBlock':
      return 'Install packages';
    default:
      throw new Error(`missing needle for ${blockName}`);
  }
}

function primarySemanticSlot(blockName: string): string {
  switch (blockName) {
    case 'InlineStatusBlock':
      return 'label';
    case 'InFlowStatusBlock':
      return 'message';
    case 'TransientOverlayBlock':
      return 'message';
    case 'ActivityStreamBlock':
      return 'events';
    case 'ShortcutCueBlock':
      return 'shortcuts';
    case 'ProgressIndicatorBlock':
      return 'label';
    default:
      throw new Error(`missing semantic slot for ${blockName}`);
  }
}

function primarySemanticValue(blockName: string): string {
  switch (blockName) {
    case 'ActivityStreamBlock':
      return '10:41 tests passed; 10:42 PR opened';
    case 'ShortcutCueBlock':
      return '/ Search; ? Help; Esc Close';
    default:
      return expectedNeedle(blockName);
  }
}
