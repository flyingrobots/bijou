import {
  bindSchemaBlockInput,
  denseComparisonSchemaBlock,
  describe,
  DESIGN_DOC,
  expect,
  explorationListSchemaBlock,
  it,
  LATE_FAMILY_BLOCKS,
  lintModeLowering,
  primarySemanticSlot,
  primarySemanticValue,
  readRepoFile,
  selectedFactValue,
  slotsFor,
} from './dogfood-late-family-six-pack.test-support.js';

describe('DF-054 to DF-059 DOGFOOD late-family Blocks', () => {
it('accepts numeric dense-comparison values at the schema boundary', () => {
    expect(bindSchemaBlockInput(denseComparisonSchemaBlock, {
      title: 'Compare packages',
      metric: 'tests',
      left: 1820,
      right: 640,
      delta: 12,
      selected: 'tests',
    })).toMatchObject({
      ok: true,
      input: {
        slots: {
          title: 'Compare packages',
          metric: 'tests',
          left: 1820,
          right: 640,
          delta: 12,
          selected: 'tests',
        },
      },
    });
  });
});

describe('DF-054 to DF-059 DOGFOOD late-family Blocks', () => {
it('rejects late-family schema accessors without invoking them', () => {
    let getterCalls = 0;
    const accessorEntry = Object.defineProperties({}, {
      title: {
        enumerable: true,
        get() {
          getterCalls += 1;
          return 'Explore components';
        },
      },
      facet: {
        enumerable: true,
        get() {
          getterCalls += 1;
          return 'input';
        },
      },
      items: {
        enumerable: true,
        get() {
          getterCalls += 1;
          return ['TextEntry field input'];
        },
      },
      selected: {
        enumerable: true,
        get() {
          getterCalls += 1;
          return 'TextEntry';
        },
      },
    });

    expect(bindSchemaBlockInput(explorationListSchemaBlock, accessorEntry)).toMatchObject({
      ok: false,
    });
    expect(getterCalls).toBe(0);
  });
});

describe('DF-054 to DF-059 DOGFOOD late-family Blocks', () => {
it('preserves required semantic facts in lowerings for the slice', () => {
    for (const block of LATE_FAMILY_BLOCKS) {
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

    for (const block of LATE_FAMILY_BLOCKS) {
      expect(block.render({
        mode: 'pipe',
        slots: slotsFor(block.metadata.blockName),
      }).facts).toContainEqual({
        kind: 'entity',
        key: 'block.selected',
        value: selectedFactValue(block.metadata.blockName),
      });
    }
  });
});

describe('DF-054 to DF-059 DOGFOOD late-family Blocks', () => {
it('records the six-pack Method design proof with TUI and lower-mode mockups', () => {
    const design = readRepoFile(DESIGN_DOC);
    const changelog = readRepoFile('docs/CHANGELOG.md');

    for (const issue of ['#238', '#239', '#240', '#241', '#242', '#243']) {
      expect(design).toContain(issue);
    }
    for (const blockName of LATE_FAMILY_BLOCKS.map((block) => block.metadata.blockName)) {
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
