import { boxSurface } from '../components/box-v3.js';
import type { Surface } from '../../ports/surface.js';
import { ownSlotValue } from './render.part03.js';
import type { StandardDrawInput } from './draw-input.js';
import { findSection, labelledSurfaces, listPieces, pieceSurface, prefixedSurface, sectionPiece } from './draw-slot.js';
import { emphasisStyle, stackBlocks, wrappedLines } from './draw-text.js';

const SELECTED_MARKER = ' › ';
const ITEM_INDENT = '   ';
/** The frame's left and right border columns. */
const FRAME_COLUMNS = 2;
/** The border columns, the corner run and the spaces around a border title. */
const TITLE_CHROME = 6;

interface GroupTitle {
  readonly border: string;
  readonly inside: readonly Surface[];
}

/**
 * The title's first line goes in the top border; lines that do not fit there
 * continue as the first rows inside the frame. A nested Surface title is drawn
 * inside the frame with its own cells.
 */
function groupTitle(input: StandardDrawInput, width: number): GroupTitle {
  const title = sectionPiece(findSection(input.sections, 'title'));
  const innerWidth = width - FRAME_COLUMNS;
  if (typeof title !== 'string') return { border: '', inside: [pieceSurface(title, innerWidth)] };
  const [border = '', ...rest] = wrappedLines(title, width - TITLE_CHROME);
  const inside = rest.length === 0 ? [] : [pieceSurface(rest.join('\n'), innerWidth, emphasisStyle('primary'))];
  return { border, inside };
}

/**
 * Draws `FramedGroupBlock` as one frame titled with its `title`, holding one
 * row per item. The item equal to `selected` carries a `›` marker; `mode`,
 * when present, follows the items after its label.
 */
export function drawFramedGroup(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const innerWidth = width - FRAME_COLUMNS;
  const selected = findSection(input.sections, 'selected')?.content;
  const title = groupTitle(input, width);
  const items = listPieces(ownSlotValue(input.slots, 'items'), findSection(input.sections, 'items'))
    .map((item) => prefixedSurface(item === selected ? SELECTED_MARKER : ITEM_INDENT, item, innerWidth));
  const mode = labelledSurfaces(input.sections, ['mode'], innerWidth - ITEM_INDENT.length)
    .map((row) => prefixedSurface(ITEM_INDENT, row, innerWidth));
  return boxSurface(stackBlocks([...title.inside, ...items, ...mode], innerWidth, 0), {
    title: title.border,
    width,
  });
}
