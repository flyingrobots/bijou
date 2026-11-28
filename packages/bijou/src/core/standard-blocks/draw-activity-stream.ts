import { createSurface, type Surface } from '../../ports/surface.js';
import type { StandardDrawInput } from './draw-input.js';
import { clipSurface, flow, sectionAtoms, textAtoms } from './draw-status-flow.js';
import { findSection, hasSlot, stackRows, textRow } from './draw-status-shared.js';
import { isSurfaceSlotValue } from './render.part02.js';
import { ownSlotValue, slotValueText } from './render.part03.js';

const SELECTED_MARK = '▸';
/** The mark column and its gap before each event. */
const MARK_COLUMNS = 2;

interface EventRow {
  readonly text: string | undefined;
  readonly atoms: readonly Surface[];
}

/** One row per non-blank event; a Surface event is blitted, clipped to the width. */
function eventRows(events: unknown, width: number): readonly EventRow[] {
  const items: readonly unknown[] = Array.isArray(events) ? events : [events];
  return items.flatMap((item): EventRow[] => {
    if (isSurfaceSlotValue(item)) return [{ text: slotValueText(item), atoms: [clipSurface(item, width)] }];
    const text = slotValueText(item);
    return text === undefined || text.trim() === '' ? [] : [{ text, atoms: textAtoms(text, width) }];
  });
}

/**
 * Draws `ActivityStreamBlock` as one entry per event, the selected event
 * marked. A long event continues on the next row under its own text.
 */
function drawActivityStream(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const inner = width - MARK_COLUMNS;
  const listed = eventRows(ownSlotValue(input.slots, 'events'), inner);
  const rows = listed.length > 0
    ? listed
    : [{ text: undefined, atoms: sectionAtoms(findSection(input.sections, 'events'), inner) }];
  const selected = findSection(input.sections, 'selected');
  const selectedText = hasSlot(selected) ? selected.content : undefined;
  return stackRows(rows.map((row) => {
    const body = flow(row.atoms, inner);
    const entry = createSurface(width, body.height);
    if (selectedText !== undefined && row.text === selectedText) entry.blit(textRow(SELECTED_MARK, 1), 0, 0);
    entry.blit(body, MARK_COLUMNS, 0);
    return entry;
  }), width);
}

export { drawActivityStream };
