import { describe, expect, it } from 'vitest';
import {
  activityStreamBlock,
  inFlowStatusBlock,
  inlineStatusBlock,
  lintModeLowering,
  progressIndicatorBlock,
  shortcutCueBlock,
  standardBlockPackageManifest,
  standardBlocks,
  transientOverlayBlock,
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
      ]));
    }
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
