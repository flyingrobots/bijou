import type { RenderSection } from './render.part01.js';
import { isSurfaceSlotValue } from './render.part02.js';
import { ownSlotValue, slotValueText } from './render.part03.js';
import type { StandardDrawInput } from './draw-input.js';
import type { SlotPart } from './draw-rows.js';

/**
 * Slot `id` as a drawing shows it: the nested block's Surface when the slot
 * holds one, otherwise its text (or missing-slot text). Undefined when an
 * optional slot is absent.
 */
export function slotPart(sections: readonly RenderSection[], id: string): SlotPart | undefined {
  return sections.find((section) => section.id === id)?.visualContent;
}

/**
 * The items of list slot `id`: each item's Surface or text, read through
 * `ownSlotValue` so accessors and non-plain records are never read. A slot
 * that is not a list, or a list with no shown items, is one part (or none).
 */
export function listParts(input: StandardDrawInput, id: string): SlotPart[] {
  const raw = ownSlotValue(input.slots, id);
  if (Array.isArray(raw)) {
    const items = raw.flatMap((item: unknown): SlotPart[] => {
      if (isSurfaceSlotValue(item)) return [item];
      const text = slotValueText(item);
      return text === undefined || text.trim() === '' ? [] : [text];
    });
    if (items.length > 0) return items;
  }
  const part = slotPart(input.sections, id);
  return part === undefined || part === '' ? [] : [part];
}

/** The text of `part`, or undefined when it is a Surface or absent. */
export function partText(part: SlotPart | undefined): string | undefined {
  return typeof part === 'string' ? part : undefined;
}
