import { separatorSurface } from '../components/separator-v3.js';
import type { Surface } from '../../ports/surface.js';
import type { StandardDrawInput } from './draw-input.js';
import {
  SELECTED_MARK, listEntries, missingRows, presentSection, presentText, sectionVisual, selectedIndex, stackRows,
} from './draw-data-rows.js';
import { badgeRows, contentRows, prefixedRows } from './draw-data-wrap.js';

/**
 * Draws `ExplorationListBlock` as its title, the facet as a badge, the item
 * list with a gutter mark on exactly the item that `selected` names, and, when
 * present, the preview below an unlabelled rule. Long text wraps.
 */
export function drawExplorationList(input: StandardDrawInput): Surface {
  const { sections } = input;
  const width = input.bounds.width;
  const items = listEntries(input.slots, sections, 'items');
  const marked = selectedIndex(items, presentText(sections, 'selected'));
  const preview = presentSection(sections, 'preview');

  const rows = [
    ...contentRows(sectionVisual(sections, 'title'), width),
    ...badgeRows(sectionVisual(sections, 'facet'), width, 'accent'),
    ...items.flatMap((item, index) => prefixedRows(`${index === marked ? SELECTED_MARK : ' '} `, item, width)),
    ...missingRows(sections, 'selected', width),
    ...(preview === undefined ? [] : [separatorSurface({ width }), ...contentRows(preview.visualContent, width)]),
  ];
  return stackRows(rows, width);
}
