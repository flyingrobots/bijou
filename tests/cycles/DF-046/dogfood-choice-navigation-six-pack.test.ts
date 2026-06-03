import { describe, expect, it } from 'vitest';
import {
  binaryDecisionBlock,
  binaryDecisionSchemaBlock,
  bindSchemaBlockInput,
  isSchemaBoundBlockDefinition,
  lintModeLowering,
  multipleChoiceBlock,
  multipleChoiceSchemaBlock,
  pathProgressBlock,
  pathProgressSchemaBlock,
  peerNavigationBlock,
  peerNavigationSchemaBlock,
  progressiveDisclosureBlock,
  progressiveDisclosureSchemaBlock,
  singleChoiceBlock,
  singleChoiceSchemaBlock,
  standardBlockPackageManifest,
  standardBlocks,
  validateBlockMetadata,
} from '../../../packages/bijou/src/index.js';
import { readRepoFile } from '../repo.js';

const DESIGN_DOC = 'docs/design/DF-046-choice-navigation-standard-blocks.md';

const CHOICE_NAVIGATION_BLOCKS = [
  singleChoiceBlock,
  multipleChoiceBlock,
  binaryDecisionBlock,
  peerNavigationBlock,
  progressiveDisclosureBlock,
  pathProgressBlock,
] as const;

const CHOICE_NAVIGATION_SCHEMA_BLOCKS = [
  {
    block: singleChoiceBlock,
    schemaBlock: singleChoiceSchemaBlock,
    bind: (input: unknown) => bindSchemaBlockInput(singleChoiceSchemaBlock, input),
    valid: {
      label: 'Output mode',
      options: ['interactive', 'pipe', 'accessible'],
      selected: 'pipe',
      mode: 'radio',
      validation: 'available',
    },
    invalid: { label: 'Output mode' },
    requiredFields: ['label', 'options', 'selected'],
    optionalFields: ['mode', 'validation'],
    expectedSlots: {
      label: 'Output mode',
      options: ['interactive', 'pipe', 'accessible'],
      selected: 'pipe',
      mode: 'radio',
      validation: 'available',
    },
  },
  {
    block: multipleChoiceBlock,
    schemaBlock: multipleChoiceSchemaBlock,
    bind: (input: unknown) => bindSchemaBlockInput(multipleChoiceSchemaBlock, input),
    valid: {
      label: 'Release proof',
      checked: ['lint', 'tests'],
      unchecked: ['screenshots'],
      selected: 'lint; tests',
      validation: '2 of 3 complete',
    },
    invalid: { label: 'Release proof', checked: ['lint'] },
    requiredFields: ['label', 'checked', 'unchecked'],
    optionalFields: ['selected', 'validation'],
    expectedSlots: {
      label: 'Release proof',
      checked: ['lint', 'tests'],
      unchecked: ['screenshots'],
      selected: 'lint; tests',
      validation: '2 of 3 complete',
    },
  },
  {
    block: binaryDecisionBlock,
    schemaBlock: binaryDecisionSchemaBlock,
    bind: (input: unknown) => bindSchemaBlockInput(binaryDecisionSchemaBlock, input),
    valid: {
      label: 'Merge gate',
      selected: 'yes',
      consequence: 'admin merge',
      confirmation: 'CI green',
      disabledReason: 'none',
    },
    invalid: { label: 'Merge gate' },
    requiredFields: ['label', 'selected', 'consequence'],
    optionalFields: ['confirmation', 'disabledReason'],
    expectedSlots: {
      label: 'Merge gate',
      selected: 'yes',
      consequence: 'admin merge',
      confirmation: 'CI green',
      disabledReason: 'none',
    },
  },
  {
    block: peerNavigationBlock,
    schemaBlock: peerNavigationSchemaBlock,
    bind: (input: unknown) => bindSchemaBlockInput(peerNavigationSchemaBlock, input),
    valid: {
      previous: 'Architecture',
      current: 'Blocks',
      next: 'Method',
      route: 'docs/blocks',
      status: 'available',
    },
    invalid: { current: 'Blocks' },
    requiredFields: ['previous', 'current', 'next'],
    optionalFields: ['route', 'status'],
    expectedSlots: {
      previous: 'Architecture',
      current: 'Blocks',
      next: 'Method',
      route: 'docs/blocks',
      status: 'available',
    },
  },
  {
    block: progressiveDisclosureBlock,
    schemaBlock: progressiveDisclosureSchemaBlock,
    bind: (input: unknown) => bindSchemaBlockInput(progressiveDisclosureSchemaBlock, input),
    valid: {
      label: 'Advanced options',
      state: 'closed',
      hiddenCount: 6,
      summary: '6 options hidden',
      details: ['debug traces', 'layout facts'],
    },
    invalid: { label: 'Advanced options', state: 'closed' },
    requiredFields: ['label', 'state', 'hiddenCount'],
    optionalFields: ['summary', 'details'],
    expectedSlots: {
      label: 'Advanced options',
      state: 'closed',
      hiddenCount: 6,
      summary: '6 options hidden',
      details: ['debug traces', 'layout facts'],
    },
  },
  {
    block: pathProgressBlock,
    schemaBlock: pathProgressSchemaBlock,
    bind: (input: unknown) => bindSchemaBlockInput(pathProgressSchemaBlock, input),
    valid: {
      path: ['Setup', 'Blocks', 'Preview'],
      current: 'Blocks',
      step: 2,
      total: 3,
      status: 'current',
    },
    invalid: { current: 'Blocks', step: 2 },
    requiredFields: ['path', 'current', 'step', 'total'],
    optionalFields: ['status'],
    expectedSlots: {
      path: ['Setup', 'Blocks', 'Preview'],
      current: 'Blocks',
      step: 2,
      total: 3,
      status: 'current',
    },
  },
] as const;

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

  it('rejects choice/navigation schema accessors without invoking them', () => {
    let getterCalls = 0;
    const accessorEntry = Object.defineProperties({}, {
      label: {
        enumerable: true,
        get() {
          getterCalls += 1;
          return 'Output mode';
        },
      },
      options: {
        enumerable: true,
        get() {
          getterCalls += 1;
          return ['interactive', 'pipe'];
        },
      },
      selected: {
        enumerable: true,
        get() {
          getterCalls += 1;
          return 'pipe';
        },
      },
    });

    expect(bindSchemaBlockInput(singleChoiceSchemaBlock, accessorEntry)).toMatchObject({
      ok: false,
    });
    expect(getterCalls).toBe(0);
  });

  it('preserves required semantic facts in lowerings for the slice', () => {
    for (const block of CHOICE_NAVIGATION_BLOCKS) {
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

    for (const blockName of ['SingleChoiceBlock', 'MultipleChoiceBlock', 'BinaryDecisionBlock']) {
      const block = CHOICE_NAVIGATION_BLOCKS.find((candidate) => candidate.metadata.blockName === blockName)!;
      expect(block.render({
        mode: 'pipe',
        slots: slotsFor(blockName),
      }).facts).toContainEqual({
        kind: 'entity',
        key: 'block.selected',
        value: selectedFactValue(blockName),
      });
    }
  });

  it('records the six-pack Method design proof with TUI and lower-mode mockups', () => {
    const design = readRepoFile(DESIGN_DOC);
    const changelog = readRepoFile('docs/CHANGELOG.md');

    for (const issue of ['#232', '#233', '#234', '#235', '#236', '#237']) {
      expect(design).toContain(issue);
    }
    for (const blockName of CHOICE_NAVIGATION_BLOCKS.map((block) => block.metadata.blockName)) {
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
    case 'SingleChoiceBlock':
      return {
        label: 'Output mode',
        options: ['interactive', 'pipe', 'accessible'],
        selected: 'pipe',
        mode: 'radio',
        validation: 'available',
      };
    case 'MultipleChoiceBlock':
      return {
        label: 'Release proof',
        checked: ['lint', 'tests'],
        unchecked: ['screenshots'],
        selected: 'lint; tests',
        validation: '2 of 3 complete',
      };
    case 'BinaryDecisionBlock':
      return {
        label: 'Merge gate',
        selected: 'yes',
        consequence: 'admin merge',
        confirmation: 'CI green',
        disabledReason: 'none',
      };
    case 'PeerNavigationBlock':
      return {
        previous: 'Architecture',
        current: 'Blocks',
        next: 'Method',
        route: 'docs/blocks',
        status: 'available',
      };
    case 'ProgressiveDisclosureBlock':
      return {
        label: 'Advanced options',
        state: 'closed',
        hiddenCount: 6,
        summary: '6 options hidden',
        details: ['debug traces', 'layout facts'],
      };
    case 'PathProgressBlock':
      return {
        path: ['Setup', 'Blocks', 'Preview'],
        current: 'Blocks',
        step: 2,
        total: 3,
        status: 'current',
      };
    default:
      throw new Error(`missing slots for ${blockName}`);
  }
}

function expectedNeedle(blockName: string): string {
  switch (blockName) {
    case 'SingleChoiceBlock':
      return 'Output mode';
    case 'MultipleChoiceBlock':
      return 'Release proof';
    case 'BinaryDecisionBlock':
      return 'Merge gate';
    case 'PeerNavigationBlock':
      return 'Blocks';
    case 'ProgressiveDisclosureBlock':
      return 'Advanced options';
    case 'PathProgressBlock':
      return 'Setup; Blocks; Preview';
    default:
      throw new Error(`missing needle for ${blockName}`);
  }
}

function primarySemanticSlot(blockName: string): string {
  switch (blockName) {
    case 'SingleChoiceBlock':
    case 'MultipleChoiceBlock':
    case 'BinaryDecisionBlock':
    case 'ProgressiveDisclosureBlock':
      return 'label';
    case 'PeerNavigationBlock':
    case 'PathProgressBlock':
      return 'current';
    default:
      throw new Error(`missing semantic slot for ${blockName}`);
  }
}

function primarySemanticValue(blockName: string): string {
  switch (blockName) {
    case 'PeerNavigationBlock':
      return 'Blocks';
    case 'PathProgressBlock':
      return 'Blocks';
    default:
      return expectedNeedle(blockName);
  }
}

function selectedFactValue(blockName: string): string {
  switch (blockName) {
    case 'SingleChoiceBlock':
      return 'pipe';
    case 'MultipleChoiceBlock':
      return 'lint; tests';
    case 'BinaryDecisionBlock':
      return 'yes';
    default:
      throw new Error(`missing selected fact for ${blockName}`);
  }
}
