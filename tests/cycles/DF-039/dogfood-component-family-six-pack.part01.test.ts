import {
  commandPrefix,
  COMPONENT_FAMILY_BLOCKS,
  COMPONENT_FAMILY_SCHEMA_BLOCKS,
  describe,
  DESIGN_DOC,
  expect,
  expectedNeedle,
  isSchemaBoundBlockDefinition,
  it,
  slotsFor,
  standardBlockPackageManifest,
  standardBlocks,
  storyPrefix,
  validateBlockMetadata,
} from './dogfood-component-family-six-pack.test-support.js';

describe('DF-039 to DF-045 DOGFOOD component-family Blocks', () => {
  it('publishes the component-family block slice through the standard catalog', () => {
    expect(COMPONENT_FAMILY_BLOCKS.map((block) => block.metadata.blockName)).toEqual([
      'FramedGroupBlock',
      'ExplainabilityWalkthroughBlock',
      'FormattedDocumentBlock',
      'LinkDestinationBlock',
      'DividerBlock',
      'TextEntryBlock',
    ]);

    expect(COMPONENT_FAMILY_BLOCKS.map((block) => block.metadata.family)).toEqual([
      'grouping',
      'explainability',
      'document',
      'navigation',
      'structure',
      'input',
    ]);
    expect(COMPONENT_FAMILY_BLOCKS.map((block) => block.metadata.scale)).toEqual([
      'section',
      'section',
      'section',
      'inline',
      'inline',
      'section',
    ]);

    for (const block of COMPONENT_FAMILY_BLOCKS) {
      expect(validateBlockMetadata(block.metadata).passed).toBe(true);
      expect(block.metadata.modes).toEqual([
        'interactive',
        'static',
        'pipe',
        'accessible',
      ]);
      expect(block.metadata.docs.relatedDocs ?? []).toContain(DESIGN_DOC);
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

    expect(standardBlocks).toEqual(expect.arrayContaining([...COMPONENT_FAMILY_BLOCKS]));
    expect(standardBlockPackageManifest.blocks).toEqual(expect.arrayContaining([
      'FramedGroupBlock',
      'ExplainabilityWalkthroughBlock',
      'FormattedDocumentBlock',
      'LinkDestinationBlock',
      'DividerBlock',
      'TextEntryBlock',
    ]));
  });
});

describe('DF-039 to DF-045 DOGFOOD component-family Blocks', () => {
  it('renders each component-family block across visual and lower modes', () => {
    for (const block of COMPONENT_FAMILY_BLOCKS) {
      const slots = slotsFor(block.metadata.blockName);
      const interactive = block.render({ mode: 'interactive', slots, config: { width: 60 } });
      const staticOutput = block.render({ mode: 'static', slots, config: { width: 60 } });
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

describe('DF-039 to DF-045 DOGFOOD component-family Blocks', () => {
  it('binds schema-validated component-family data to render slots', () => {
    for (const spec of COMPONENT_FAMILY_SCHEMA_BLOCKS) {
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
