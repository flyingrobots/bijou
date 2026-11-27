import { badge } from '../components/badge.js';
import { separatorSurface } from '../components/separator-v3.js';
import type { Surface } from '../../ports/surface.js';
import type { StandardDrawInput } from './draw-input.js';
import {
  SELECTED_MARK, definedRows, listEntries, missingRow, presentSection, sectionText,
  selectedIndex, stackRows, textRow,
} from './draw-data-rows.js';

/**
 * Draws `ExplorationListBlock` as its title, the facet as a badge, the item
 * list with a gutter mark on exactly the item that `selected` names, and, when
 * present, the preview below an unlabelled rule.
 */
export function drawExplorationList(input: StandardDrawInput): Surface {
  const { sections } = input;
  const width = input.bounds.width;
  const items = listEntries(input.slots, sections, 'items');
  const marked = selectedIndex(items, presentSection(sections, 'selected')?.content);
  const preview = presentSection(sections, 'preview');

  const rows = [
    textRow(sectionText(sections, 'title')),
    badge(sectionText(sections, 'facet'), { variant: 'accent' }),
    ...items.map((item, index) => textRow(`${index === marked ? SELECTED_MARK : ' '} ${item}`)),
    missingRow(sections, 'selected'),
    ...(preview === undefined ? [] : [separatorSurface({ width }), textRow(preview.content)]),
  ];
  return stackRows(definedRows(rows), width);
}
