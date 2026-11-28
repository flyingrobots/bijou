import {
  binaryDecisionBlock,
  describe,
  expect,
  it,
  multipleChoiceBlock,
  singleChoiceBlock,
  textEntryBlock,
} from './standard-blocks.test-support.js';
import { drawnFrame, framedSlotTitles } from './standard-blocks-drawn.test-support.js';
import {
  CHOICE_DRAW_SPECS,
  cellModifiers,
  drawBlock,
  drawResult,
  fuzzWord,
  hasControlCharacter,
  seededRandom,
  trimmedRows,
  withoutSlot,
} from './standard-blocks-choice-drawn.test-support.js';

describe.each(CHOICE_DRAW_SPECS)('$block.metadata.blockName interactive drawing (flyingrobots/bijou#937)', (spec) => {
  const { block } = spec;

  it('draws the DOGFOOD example slots as a form control at width 60', () => {
    const frame = drawBlock(block, spec.slots);

    expect(frame.width).toBe(60);
    expect(trimmedRows(frame)).toEqual(spec.golden);
  });

  it('draws the same frame in static mode as in interactive mode', () => {
    const staticFrame = drawnFrame(block.render({ mode: 'static', slots: spec.slots, config: { width: 60 } }));
    expect(staticFrame.rows).toEqual(drawBlock(block, spec.slots).rows);
  });

  it('shows no framed box titled with one of its slot labels', () => {
    expect(framedSlotTitles(block, drawBlock(block, spec.slots))).toEqual([]);
  });

  it('fits the narrowest and the widest width exactly', () => {
    for (const width of [30, 120]) {
      const frame = drawBlock(block, spec.slots, width);
      expect(frame.width).toBe(width);
      expect(frame.rows.every((row) => row.length === width)).toBe(true);
      expect(framedSlotTitles(block, frame)).toEqual([]);
    }
  });

  it('leaves every absent optional slot out of the drawing', () => {
    expect(trimmedRows(drawBlock(block, spec.requiredOnly))).toEqual(spec.requiredGolden);
  });

  it('shows the missing-slot text inside the drawing when a required slot is absent', () => {
    const frame = drawBlock(block, withoutSlot(spec.slots, spec.missingSlot));

    expect(frame.rows.some((row) => row.includes(`(missing required ${spec.missingSlot})`))).toBe(true);
    expect(framedSlotTitles(block, frame)).toEqual([]);
  });

  it('keeps pipe and accessible output as labelled slot lines', () => {
    expect(block.render({ mode: 'pipe', slots: spec.slots }).output).toBe(spec.pipe);
    expect(block.render({ mode: 'accessible', slots: spec.slots }).output).toBe(spec.accessible);
  });

  it('fits every width from 30 to 120 for seeded random slots within its schema', () => {
    const next = seededRandom(937);
    const word = fuzzWord(next);
    let witnesses = 0;
    for (let width = 30; width <= 120; width += 1) {
      const frame = drawBlock(block, spec.fuzz(word, next), width);
      expect(frame.width).toBe(width);
      expect(frame.rows.every((row) => row.length === width)).toBe(true);
      expect(hasControlCharacter(frame.rows.join(''))).toBe(false);
      witnesses += 1;
    }
    expect(witnesses).toBe(91);
  });
});

describe('TextEntryBlock input box (flyingrobots/bijou#937)', () => {
  it('shows the placeholder, dimmed, inside the input box when the value is empty', () => {
    const slots = { field: 'Search docs', value: '', placeholder: 'type a query' };

    expect(drawBlock(textEntryBlock, slots).rows[2]).toMatch(/^│ type a query +│$/u);
    expect(cellModifiers(drawResult(textEntryBlock, slots), 2, 2)).toContain('dim');
  });

  it('shows the value, not the placeholder, when the value is set', () => {
    const slots = { field: 'Search docs', value: 'table', placeholder: 'type a query' };
    const frame = drawBlock(textEntryBlock, slots);

    expect(frame.rows[2]).toMatch(/^│ table +│$/u);
    expect(frame.rows.join('\n')).not.toContain('type a query');
    expect(cellModifiers(drawResult(textEntryBlock, slots), 2, 2)).not.toContain('dim');
  });

  it('shows the missing field text in the field label row', () => {
    expect(drawBlock(textEntryBlock, { value: 'table' }).rows[0]).toContain('(missing required field)');
  });
});

describe('SingleChoiceBlock and MultipleChoiceBlock marks (flyingrobots/bijou#937)', () => {
  const count = (rows: readonly string[], glyph: string) => rows.filter((row) => row.includes(glyph)).length;

  it('marks exactly the selected option, in bold', () => {
    const slots = { label: 'Mode', options: ['a', 'b', 'c', 'd'], selected: 'c' };
    const frame = drawBlock(singleChoiceBlock, slots);

    expect(count(frame.rows, '◉')).toBe(1);
    expect(count(frame.rows, '○')).toBe(3);
    expect(frame.rows[3]?.trimEnd()).toBe('  ◉ c');
    expect(cellModifiers(drawResult(singleChoiceBlock, slots), 4, 3)).toContain('bold');
    expect(cellModifiers(drawResult(singleChoiceBlock, slots), 4, 2)).not.toContain('bold');
  });

  it('marks no option and shows the selection when it is not one of the options', () => {
    const frame = drawBlock(singleChoiceBlock, { label: 'Mode', options: ['a', 'b'], selected: 'z' });

    expect(count(frame.rows, '◉')).toBe(0);
    expect(trimmedRows(frame)).toContain('z');
  });

  it('marks every checked option and none of the unchecked ones', () => {
    const frame = drawBlock(multipleChoiceBlock, { label: 'Proof', checked: ['a', 'b', 'c'], unchecked: ['d', 'e'] });

    expect(trimmedRows(frame)).toEqual(['Proof', '  ☑ a', '  ☑ b', '  ☑ c', '  ☐ d', '  ☐ e']);
  });
});

describe('BinaryDecisionBlock choices (flyingrobots/bijou#937)', () => {
  it('emphasises no when no is selected', () => {
    const slots = { label: 'Gate', selected: 'no', consequence: 'stop' };
    const result = drawResult(binaryDecisionBlock, slots);

    expect(drawBlock(binaryDecisionBlock, slots).rows[1]?.trimEnd()).toBe('  ○ yes  ◉ no');
    expect(cellModifiers(result, 9, 1)).toContain('bold');
    expect(cellModifiers(result, 2, 1)).not.toContain('bold');
  });

  it('shows the missing selection text below unmarked choices', () => {
    const frame = drawBlock(binaryDecisionBlock, { label: 'Gate', consequence: 'stop' });

    expect(frame.rows[1]?.trimEnd()).toBe('  ○ yes  ○ no');
    expect(frame.rows[2]).toContain('(missing required selected)');
  });
});
