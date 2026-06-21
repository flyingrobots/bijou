import {
  activityStreamBlock,
  describe,
  expect,
  it,
  lintModeLowering,
  primarySemanticSlot,
  primarySemanticValue,
  slotsFor,
  STATUS_FEEDBACK_BLOCKS,
} from './status-feedback-blocks.test-support.js';

describe('DF-031 to DF-038 status and feedback Blocks', () => {
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
