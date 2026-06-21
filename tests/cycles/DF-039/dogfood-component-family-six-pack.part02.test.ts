import {
  bindSchemaBlockInput,
  COMPONENT_FAMILY_BLOCKS,
  describe,
  DESIGN_DOC,
  expect,
  framedGroupBlock,
  it,
  lintModeLowering,
  primarySemanticSlot,
  primarySemanticValue,
  readRepoFile,
  slotsFor,
  textEntrySchemaBlock,
} from './dogfood-component-family-six-pack.test-support.js';

describe('DF-039 to DF-045 DOGFOOD component-family Blocks', () => {
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
});

describe('DF-039 to DF-045 DOGFOOD component-family Blocks', () => {
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
});

describe('DF-039 to DF-045 DOGFOOD component-family Blocks', () => {
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
