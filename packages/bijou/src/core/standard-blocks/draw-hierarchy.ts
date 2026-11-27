import type { Surface } from '../../ports/surface.js';
import type { StandardDrawInput } from './draw-input.js';
import {
  SELECTED_MARK, definedRows, factsRow, listEntries, missingRow, presentSection, sectionText,
  selectedIndex, stackRows, textRow,
} from './draw-data-rows.js';

/** The tree connectors of `tree()`: a middle child, then the last child. */
const MIDDLE_CONNECTOR = '├─ ';
const LAST_CONNECTOR = '└─ ';

/**
 * Draws `HierarchyBlock` as a one-level tree: the root, then each node with the
 * `tree()` connectors. A gutter marks exactly the entry that `selected` names
 * (the root or one node). `parent`, `depth` and `expanded` follow as one facts
 * row when present.
 */
export function drawHierarchy(input: StandardDrawInput): Surface {
  const { sections } = input;
  const root = sectionText(sections, 'root');
  const nodes = listEntries(input.slots, sections, 'nodes');
  const marked = selectedIndex([root, ...nodes], presentSection(sections, 'selected')?.content);
  const gutter = (index: number) => (index === marked ? `${SELECTED_MARK} ` : '  ');

  const rows = [
    textRow(`${gutter(0)}${root}`),
    ...nodes.map((node, index) => {
      const connector = index === nodes.length - 1 ? LAST_CONNECTOR : MIDDLE_CONNECTOR;
      return textRow(`${gutter(index + 1)}${connector}${node}`);
    }),
    factsRow(sections, ['parent', 'depth', 'expanded']),
    missingRow(sections, 'selected'),
  ];
  return stackRows(definedRows(rows), input.bounds.width);
}
