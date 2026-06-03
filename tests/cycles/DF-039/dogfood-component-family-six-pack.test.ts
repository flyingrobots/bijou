import { describe, expect, it } from 'vitest';
import {
  bindSchemaBlockInput,
  dividerBlock,
  dividerSchemaBlock,
  explainabilityWalkthroughBlock,
  explainabilityWalkthroughSchemaBlock,
  formattedDocumentBlock,
  formattedDocumentSchemaBlock,
  framedGroupBlock,
  framedGroupSchemaBlock,
  isSchemaBoundBlockDefinition,
  linkDestinationBlock,
  linkDestinationSchemaBlock,
  lintModeLowering,
  standardBlockPackageManifest,
  standardBlocks,
  textEntryBlock,
  textEntrySchemaBlock,
  validateBlockMetadata,
} from '../../../packages/bijou/src/index.js';
import { readRepoFile } from '../repo.js';

const DESIGN_DOC = 'docs/design/DF-039-component-family-standard-blocks.md';

const COMPONENT_FAMILY_BLOCKS = [
  framedGroupBlock,
  explainabilityWalkthroughBlock,
  formattedDocumentBlock,
  linkDestinationBlock,
  dividerBlock,
  textEntryBlock,
] as const;

const COMPONENT_FAMILY_SCHEMA_BLOCKS = [
  {
    block: framedGroupBlock,
    schemaBlock: framedGroupSchemaBlock,
    bind: (input: unknown) => bindSchemaBlockInput(framedGroupSchemaBlock, input),
    valid: {
      title: 'Release Checks',
      items: ['tests green', 'docs updated', 'PR linked'],
      selected: 'tests green',
      mode: 'review',
    },
    invalid: { title: 'Release Checks' },
    requiredFields: ['title', 'items'],
    optionalFields: ['selected', 'mode'],
    expectedSlots: {
      title: 'Release Checks',
      items: ['tests green', 'docs updated', 'PR linked'],
      selected: 'tests green',
      mode: 'review',
    },
  },
  {
    block: explainabilityWalkthroughBlock,
    schemaBlock: explainabilityWalkthroughSchemaBlock,
    bind: (input: unknown) => bindSchemaBlockInput(explainabilityWalkthroughSchemaBlock, input),
    valid: {
      title: 'Why this changed',
      steps: ['input changed', 'constraint tightened', 'preview re-rendered'],
      evidence: 'DF-040 playback',
      decision: 'keep grouped proof visible',
      nextStep: 'open lower-mode output',
    },
    invalid: { title: 'Why this changed' },
    requiredFields: ['title', 'steps'],
    optionalFields: ['evidence', 'decision', 'nextStep'],
    expectedSlots: {
      title: 'Why this changed',
      steps: ['input changed', 'constraint tightened', 'preview re-rendered'],
      evidence: 'DF-040 playback',
      decision: 'keep grouped proof visible',
      nextStep: 'open lower-mode output',
    },
  },
  {
    block: formattedDocumentBlock,
    schemaBlock: formattedDocumentSchemaBlock,
    bind: (input: unknown) => bindSchemaBlockInput(formattedDocumentSchemaBlock, input),
    valid: {
      heading: 'Blocks document',
      body: 'Use prose for persistent product truth.',
      callout: 'Lower modes keep the same heading and body facts.',
      code: 'block: FormattedDocumentBlock',
    },
    invalid: { heading: 'Blocks document' },
    requiredFields: ['heading', 'body'],
    optionalFields: ['callout', 'code'],
    expectedSlots: {
      heading: 'Blocks document',
      body: 'Use prose for persistent product truth.',
      callout: 'Lower modes keep the same heading and body facts.',
      code: 'block: FormattedDocumentBlock',
    },
  },
  {
    block: linkDestinationBlock,
    schemaBlock: linkDestinationSchemaBlock,
    bind: (input: unknown) => bindSchemaBlockInput(linkDestinationSchemaBlock, input),
    valid: {
      label: 'DOGFOOD.md',
      destination: 'docs/DOGFOOD.md',
      kind: 'docs',
      status: 'available',
    },
    invalid: { label: 'DOGFOOD.md' },
    requiredFields: ['label', 'destination'],
    optionalFields: ['kind', 'status'],
    expectedSlots: {
      label: 'DOGFOOD.md',
      destination: 'docs/DOGFOOD.md',
      kind: 'docs',
      status: 'available',
    },
  },
  {
    block: dividerBlock,
    schemaBlock: dividerSchemaBlock,
    bind: (input: unknown) => bindSchemaBlockInput(dividerSchemaBlock, input),
    valid: {
      label: 'Release Evidence',
      style: 'rule',
      density: 'compact',
    },
    invalid: { style: 'rule' },
    requiredFields: ['label'],
    optionalFields: ['style', 'density'],
    expectedSlots: {
      label: 'Release Evidence',
      style: 'rule',
      density: 'compact',
    },
  },
  {
    block: textEntryBlock,
    schemaBlock: textEntrySchemaBlock,
    bind: (input: unknown) => bindSchemaBlockInput(textEntrySchemaBlock, input),
    valid: {
      field: 'Search docs',
      value: 'table',
      placeholder: 'type a query',
      validation: '4 results',
      results: 4,
    },
    invalid: { field: 'Search docs' },
    requiredFields: ['field', 'value'],
    optionalFields: ['placeholder', 'validation', 'results'],
    expectedSlots: {
      field: 'Search docs',
      value: 'table',
      placeholder: 'type a query',
      validation: '4 results',
      results: 4,
    },
  },
] as const;

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

  it('rejects component-family schema accessors without invoking them', () => {
    let getterCalls = 0;
    const accessorEntry = Object.defineProperties({}, {
      field: {
        enumerable: true,
        get() {
          getterCalls += 1;
          return 'Search docs';
        },
      },
      value: {
        enumerable: true,
        get() {
          getterCalls += 1;
          return 'table';
        },
      },
    });

    expect(bindSchemaBlockInput(textEntrySchemaBlock, accessorEntry)).toMatchObject({
      ok: false,
    });
    expect(getterCalls).toBe(0);
  });

  it('preserves required semantic facts in lowerings for the slice', () => {
    for (const block of COMPONENT_FAMILY_BLOCKS) {
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

    expect(framedGroupBlock.render({
      mode: 'pipe',
      slots: slotsFor('FramedGroupBlock'),
    }).facts).toContainEqual({
      kind: 'entity',
      key: 'block.selected',
      value: 'tests green',
    });
  });

  it('records the six-pack Method design proof with TUI and lower-mode mockups', () => {
    const design = readRepoFile(DESIGN_DOC);
    const changelog = readRepoFile('docs/CHANGELOG.md');

    for (const issue of ['#226', '#227', '#228', '#229', '#230', '#231']) {
      expect(design).toContain(issue);
    }
    for (const blockName of COMPONENT_FAMILY_BLOCKS.map((block) => block.metadata.blockName)) {
      expect(design).toContain(blockName);
      expect(changelog).toContain(blockName);
    }

    expect(design).toContain('## TUI Mockups');
    expect(design).toContain('## Lower Modes');
    expect(design).toContain('Pipe mode');
    expect(design).toContain('Accessible mode');
    expect(design).toContain('Design Thinking');
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
    case 'FramedGroupBlock':
      return {
        title: 'Release Checks',
        items: ['tests green', 'docs updated', 'PR linked'],
        selected: 'tests green',
        mode: 'review',
      };
    case 'ExplainabilityWalkthroughBlock':
      return {
        title: 'Why this changed',
        steps: ['input changed', 'constraint tightened', 'preview re-rendered'],
        evidence: 'DF-040 playback',
        decision: 'keep grouped proof visible',
        nextStep: 'open lower-mode output',
      };
    case 'FormattedDocumentBlock':
      return {
        heading: 'Blocks document',
        body: 'Use prose for persistent product truth.',
        callout: 'Lower modes keep the same heading and body facts.',
        code: 'block: FormattedDocumentBlock',
      };
    case 'LinkDestinationBlock':
      return {
        label: 'DOGFOOD.md',
        destination: 'docs/DOGFOOD.md',
        kind: 'docs',
        status: 'available',
      };
    case 'DividerBlock':
      return {
        label: 'Release Evidence',
        style: 'rule',
        density: 'compact',
      };
    case 'TextEntryBlock':
      return {
        field: 'Search docs',
        value: 'table',
        placeholder: 'type a query',
        validation: '4 results',
        results: 4,
      };
    default:
      throw new Error(`missing slots for ${blockName}`);
  }
}

function expectedNeedle(blockName: string): string {
  switch (blockName) {
    case 'FramedGroupBlock':
      return 'Release Checks';
    case 'ExplainabilityWalkthroughBlock':
      return 'Why this changed';
    case 'FormattedDocumentBlock':
      return 'Blocks document';
    case 'LinkDestinationBlock':
      return 'docs/DOGFOOD.md';
    case 'DividerBlock':
      return 'Release Evidence';
    case 'TextEntryBlock':
      return 'Search docs';
    default:
      throw new Error(`missing needle for ${blockName}`);
  }
}

function primarySemanticSlot(blockName: string): string {
  switch (blockName) {
    case 'FramedGroupBlock':
      return 'title';
    case 'ExplainabilityWalkthroughBlock':
      return 'steps';
    case 'FormattedDocumentBlock':
      return 'heading';
    case 'LinkDestinationBlock':
      return 'destination';
    case 'DividerBlock':
      return 'label';
    case 'TextEntryBlock':
      return 'field';
    default:
      throw new Error(`missing semantic slot for ${blockName}`);
  }
}

function primarySemanticValue(blockName: string): string {
  switch (blockName) {
    case 'ExplainabilityWalkthroughBlock':
      return 'input changed; constraint tightened; preview re-rendered';
    case 'LinkDestinationBlock':
      return 'docs/DOGFOOD.md';
    default:
      return expectedNeedle(blockName);
  }
}
