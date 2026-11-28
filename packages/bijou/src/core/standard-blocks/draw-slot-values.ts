import type { StandardDrawInput } from './draw-input.js';
import type { SlotVisual } from './draw-form-rows.js';
import { isSurfaceSlotValue } from './render.part02.js';
import { ownSlotValue, slotValueText } from './render.part03.js';

/** One item of a list slot: its text, for matching, and what to draw. */
interface SlotItem {
  readonly text: string;
  readonly visual: SlotVisual;
}

/** What the drawer shows for section `id`, or undefined when the block omits that optional slot. */
function sectionVisual(input: StandardDrawInput, id: string): SlotVisual | undefined {
  return input.sections.find((section) => section.id === id)?.visualContent;
}

/** The section's missing-slot text when a required slot is absent, else undefined. */
function missingText(input: StandardDrawInput, id: string): string | undefined {
  const section = input.sections.find((candidate) => candidate.id === id);
  return section !== undefined && !section.present ? section.content : undefined;
}

/**
 * The items of a list slot: each array entry, or the whole value as one item.
 * The slot is read with `ownSlotValue`, so accessor properties never run.
 * A Surface item is kept to be blitted. Blank entries and absent slots give no items.
 */
function slotItems(input: StandardDrawInput, id: string): readonly SlotItem[] {
  const raw = ownSlotValue(input.slots, id);
  const values: readonly unknown[] = Array.isArray(raw) ? raw : [raw];
  return values.flatMap((value) => {
    const text = slotValueText(value);
    if (text === undefined || text.trim() === '') return [];
    return [{ text, visual: isSurfaceSlotValue(value) ? value : text }];
  });
}

export type { SlotItem };
export { missingText, sectionVisual, slotItems };
