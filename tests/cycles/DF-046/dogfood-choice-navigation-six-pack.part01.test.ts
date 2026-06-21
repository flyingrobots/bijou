import {
  CHOICE_NAVIGATION_BLOCKS,
  CHOICE_NAVIGATION_SCHEMA_BLOCKS,
  commandPrefix,
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
} from './dogfood-choice-navigation-six-pack.test-support.js';

describe('DF-046 to DF-052 DOGFOOD choice and navigation Blocks', () => {
it('publishes the choice/navigation block slice through the standard catalog', () => {
    expect(CHOICE_NAVIGATION_BLOCKS.map((block) => block.metadata.blockName)).toEqual([
      'SingleChoiceBlock',
      'MultipleChoiceBlock',
      'BinaryDecisionBlock',
      'PeerNavigationBlock',
      'ProgressiveDisclosureBlock',
      'PathProgressBlock',
    ]);
    expect(CHOICE_NAVIGATION_BLOCKS.map((block) => block.metadata.family)).toEqual([
      'input',
      'input',
      'input',
      'navigation',
      'disclosure',
      'navigation',
    ]);
    expect(CHOICE_NAVIGATION_BLOCKS.map((block) => block.metadata.scale)).toEqual([
      'section',
      'section',
      'section',
      'section',
      'section',
      'section',
    ]);
    for (const block of CHOICE_NAVIGATION_BLOCKS) {
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
    expect(standardBlocks).toEqual(expect.arrayContaining([...CHOICE_NAVIGATION_BLOCKS]));
    expect(standardBlockPackageManifest.blocks).toEqual(expect.arrayContaining([
      'SingleChoiceBlock',
      'MultipleChoiceBlock',
      'BinaryDecisionBlock',
      'PeerNavigationBlock',
      'ProgressiveDisclosureBlock',
      'PathProgressBlock',
    ]));
  });
});

describe('DF-046 to DF-052 DOGFOOD choice and navigation Blocks', () => {
it('renders each choice/navigation block across visual and lower modes', () => {
    for (const block of CHOICE_NAVIGATION_BLOCKS) {
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

describe('DF-046 to DF-052 DOGFOOD choice and navigation Blocks', () => {
it('binds schema-validated choice/navigation data to render slots', () => {
    for (const spec of CHOICE_NAVIGATION_SCHEMA_BLOCKS) {
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
