import { describe, expect, it } from './standard-blocks.test-support.js';
import { drawnFrame, framedSlotTitles } from './standard-blocks-drawn.test-support.js';
import { CHOICE_DRAW_SPECS, cellModifiers, drawBlock, drawResult } from './standard-blocks-choice-drawn.test-support.js';
import {
  CHOICE_REPAIR_SPECS,
  longSentence,
  missingWords,
  styledSurface,
  withThrowingGetter,
} from './standard-blocks-choice-repairs.test-support.js';

function cellPosition(rows: readonly string[], text: string): readonly [number, number] | undefined {
  for (const [y, row] of rows.entries()) {
    const x = row.indexOf(text);
    if (x >= 0) return [x, y];
  }
  return undefined;
}

describe.each(CHOICE_REPAIR_SPECS)('$block.metadata.blockName drawing repairs (flyingrobots/bijou#937)', (spec) => {
  const { block } = spec;

  it('R1: blits a Surface slot value with its cell styles kept', () => {
    const slots = spec.withSurface(styledSurface());
    const frame = drawBlock(block, slots);
    const position = cellPosition(frame.rows, 'nested');

    expect(position).toBeDefined();
    const [x, y] = position ?? [0, 0];
    expect(cellModifiers(drawResult(block, slots), x, y)).toContain('strikethrough');
    expect(framedSlotTitles(block, frame)).toEqual([]);
  });

  it('R1: clips a Surface slot value wider than the row', () => {
    for (const width of [30, 120]) {
      const frame = drawBlock(block, spec.withSurface(styledSurface()), width);
      expect(frame.rows.every((row) => row.length === width)).toBe(true);
    }
  });

  it('R2: wraps long slot text at width 30 so no word is lost', () => {
    const frame = drawBlock(block, spec.longText(longSentence), 30);

    expect(frame.rows.every((row) => row.length === 30)).toBe(true);
    for (const id of spec.drawnTextSlots) {
      expect(missingWords(longSentence(id), frame.rows)).toEqual([]);
    }
  });

  it('R3: draws the missing-slot text when a required slot is a throwing getter', () => {
    const drawSpec = CHOICE_DRAW_SPECS.find((candidate) => candidate.block === block);
    const missingSlot = drawSpec?.missingSlot ?? '';
    const slots = withThrowingGetter(drawSpec?.slots ?? {}, missingSlot);
    const frame = drawnFrame(block.render({ mode: 'interactive', slots, config: { width: 30 } }));

    expect(missingWords(`(missing required ${missingSlot})`, frame.rows)).toEqual([]);
  });
});

/**
 * Slots these drawings do not show as text: `mode` is a variant token, `results`
 * is a count the validation line carries, and `placeholder` shows only while
 * the value is empty.
 */
const NOT_DRAWN_AS_TEXT: ReadonlySet<string> = new Set(['mode', 'results', 'placeholder']);

describe('R2: missing-slot text wraps at width 30 (flyingrobots/bijou#937)', () => {
  it.each(CHOICE_DRAW_SPECS)('$block.metadata.blockName keeps every word of its missing-slot text', (spec) => {
    const rest = Object.fromEntries(Object.entries(spec.slots).filter(([key]) => key !== spec.missingSlot));
    const frame = drawBlock(spec.block, rest, 30);

    expect(missingWords(`(missing required ${spec.missingSlot})`, frame.rows)).toEqual([]);
  });

  it.each(CHOICE_DRAW_SPECS)('$block.metadata.blockName keeps every DOGFOOD slot word at width 30', (spec) => {
    const frame = drawBlock(spec.block, spec.slots, 30);
    const shown = Object.entries(spec.slots)
      .filter(([id]) => !NOT_DRAWN_AS_TEXT.has(id))
      .flatMap(([, value]) => {
        const items: readonly unknown[] = Array.isArray(value) ? value : [value];
        return items;
      })
      .filter((value): value is string => typeof value === 'string');

    for (const text of shown) expect(missingWords(text, frame.rows)).toEqual([]);
  });
});
