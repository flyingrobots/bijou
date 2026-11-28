import type { Surface } from '../../ports/surface.js';
import type { StandardDrawInput } from './draw-input.js';
import {
  SELECTED_MARK, factsRows, listEntries, missingRows, presentText, sectionVisual, selectedIndex, stackRows,
} from './draw-data-rows.js';
import { prefixedRows } from './draw-data-wrap.js';

/** The tree connectors of `tree()`: a middle child, then the last child, and the guide under a middle child. */
const MIDDLE_CONNECTOR = '├─ ';
const LAST_CONNECTOR = '└─ ';
const MIDDLE_GUIDE = '│  ';
const LAST_GUIDE = '   ';

/**
 * Draws `HierarchyBlock` as a one-level tree: the root, then each node with the
 * `tree()` connectors. A gutter marks exactly the entry that `selected` names
 * (the root or one node). Long entries wrap under their own guide line.
 * `parent`, `depth` and `expanded` follow as facts when present.
 */
export function drawHierarchy(input: StandardDrawInput): Surface {
  const { sections } = input;
  const width = input.bounds.width;
  const root = sectionVisual(sections, 'root');
  const nodes = listEntries(input.slots, sections, 'nodes');
  const marked = selectedIndex([root, ...nodes], presentText(sections, 'selected'));
  const gutter = (index: number) => (index === marked ? `${SELECTED_MARK} ` : '  ');

  const rows = [
    ...prefixedRows(gutter(0), root, width, '  '),
    ...nodes.flatMap((node, index) => {
      const last = index === nodes.length - 1;
      const connector = last ? LAST_CONNECTOR : MIDDLE_CONNECTOR;
      return prefixedRows(`${gutter(index + 1)}${connector}`, node, width, `  ${last ? LAST_GUIDE : MIDDLE_GUIDE}`);
    }),
    ...factsRows(sections, ['parent', 'depth', 'expanded'], width),
    ...missingRows(sections, 'selected', width),
  ];
  return stackRows(rows, width);
}
