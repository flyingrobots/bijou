import { boxSurface } from '../components/box-v3.js';
import type { Surface } from '../../ports/surface.js';
import { ownSlotValue } from './render.part03.js';
import { sectionContent, type StandardDrawInput } from './draw-input.js';
import { labelledLines, linesSurface, listItems, wrappedLines } from './draw-text.js';

const SELECTED_MARKER = ' › ';
const ITEM_INDENT = '   ';
/** The frame's left and right border columns. */
const FRAME_COLUMNS = 2;

function itemLines(item: string, selected: boolean, width: number): string[] {
  return wrappedLines(item, width).map((line, index) =>
    `${index === 0 && selected ? SELECTED_MARKER : ITEM_INDENT}${line}`);
}

/**
 * Draws `FramedGroupBlock` as one frame titled with its `title`, holding one
 * row per item. The item equal to `selected` carries a `›` marker; `mode`,
 * when present, follows the items after its label.
 */
export function drawFramedGroup(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const innerWidth = width - FRAME_COLUMNS;
  const textWidth = innerWidth - ITEM_INDENT.length;
  const selected = sectionContent(input.sections, 'selected');
  const itemsSection = input.sections.find((section) => section.id === 'items');
  const rows = [
    ...listItems(ownSlotValue(input.slots, 'items'), itemsSection)
      .flatMap((item) => itemLines(item, item === selected, textWidth)),
    ...labelledLines(input.sections, ['mode'], textWidth).map((line) => `${ITEM_INDENT}${line}`),
  ];
  return boxSurface(linesSurface(rows, innerWidth), {
    title: sectionContent(input.sections, 'title') ?? '',
    width,
  });
}
