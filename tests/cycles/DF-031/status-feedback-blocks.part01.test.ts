import {
  bindSchemaBlockInput,
  commandPrefix,
  describe,
  expect,
  expectedNeedle,
  inlineStatusSchemaBlock,
  isSchemaBoundBlockDefinition,
  it,
  slotsFor,
  standardBlockPackageManifest,
  standardBlocks,
  STATUS_FEEDBACK_BLOCKS,
  STATUS_FEEDBACK_SCHEMA_BLOCKS,
  storyPrefix,
  validateBlockMetadata,
} from './status-feedback-blocks.test-support.js';

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
});

describe('DF-031 to DF-038 status and feedback Blocks', () => {
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
});

describe('DF-031 to DF-038 status and feedback Blocks', () => {
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
});

describe('DF-031 to DF-038 status and feedback Blocks', () => {
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
});
