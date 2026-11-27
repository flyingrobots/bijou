import type { Surface } from '../../ports/surface.js';
import type { StandardDrawInput } from './draw-input.js';
import { sectionContent } from './draw-input.js';
import { listItems, stackRows, textRow } from './draw-status-shared.js';
import { ownSlotValue } from './render.part03.js';

const SELECTED_MARK = '▸ ';
const UNSELECTED_MARK = '  ';

/** The items of list slot `id`, or its missing-slot text when the block has none. */
function listOrMissing(input: StandardDrawInput, id: string): readonly string[] {
  const items = listItems(ownSlotValue(input.slots, id));
  if (items.length > 0) return items;
  const content = sectionContent(input.sections, id);
  return content === undefined || content === '' ? [] : [content];
}

/** Draws `ActivityStreamBlock` as one row per event, the selected event marked. */
function drawActivityStream(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const selected = sectionContent(input.sections, 'selected');
  const rows = listOrMissing(input, 'events').map((event) =>
    textRow(`${event === selected ? SELECTED_MARK : UNSELECTED_MARK}${event}`, width));
  return stackRows(rows, width);
}

export { drawActivityStream };
