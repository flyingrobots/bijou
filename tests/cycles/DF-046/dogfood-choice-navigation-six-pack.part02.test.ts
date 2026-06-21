import {
  bindSchemaBlockInput,
  CHOICE_NAVIGATION_BLOCKS,
  describe,
  DESIGN_DOC,
  expect,
  it,
  lintModeLowering,
  must,
  primarySemanticSlot,
  primarySemanticValue,
  readRepoFile,
  selectedFactValue,
  singleChoiceSchemaBlock,
  slotsFor,
} from './dogfood-choice-navigation-six-pack.test-support.js';

describe('DF-046 to DF-052 DOGFOOD choice and navigation Blocks', () => {
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
});

describe('DF-046 to DF-052 DOGFOOD choice and navigation Blocks', () => {
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
      const block = must(CHOICE_NAVIGATION_BLOCKS.find((candidate) => candidate.metadata.blockName === blockName));
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
});

describe('DF-046 to DF-052 DOGFOOD choice and navigation Blocks', () => {
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
