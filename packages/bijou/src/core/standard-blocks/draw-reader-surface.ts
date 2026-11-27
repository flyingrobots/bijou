import type { Surface } from '../../ports/surface.js';
import type { StandardDrawInput } from './draw-input.js';
import {
  SEPARATOR_WIDTH,
  besideRegions,
  blockFrame,
  findSection,
  framedInnerWidth,
  listedContent,
  regionSurface,
  sideWidth,
} from './draw-regions.js';

/**
 * Draws `ReaderSurface` as one framed reading view: navigation in a leading
 * column, the content in the middle, and the outline, one heading per row,
 * in a trailing column. `bounds.sectionHeight` caps the rows.
 */
export function drawReaderSurface(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const inner = framedInnerWidth(width);
  const height = input.bounds.sectionHeight;
  const navigation = findSection(input.sections, 'navigation');
  const content = findSection(input.sections, 'content');
  const outline = findSection(input.sections, 'outline');

  const navigationWidth = navigation === undefined ? 0 : sideWidth(inner, 4, 6, 24);
  const outlineWidth = outline === undefined ? 0 : sideWidth(inner, 4, 6, 24);
  const separators = (navigation === undefined ? 0 : 1) + (outline === undefined ? 0 : 1);
  const contentWidth = inner - navigationWidth - outlineWidth - (SEPARATOR_WIDTH * separators);

  const columns: Surface[] = [];
  if (navigation !== undefined) {
    columns.push(regionSurface(navigation.visualContent, navigationWidth, height));
  }
  columns.push(regionSurface(content?.visualContent ?? '', contentWidth, height));
  if (outline !== undefined) {
    columns.push(regionSurface(listedContent(outline, input.slots), outlineWidth, height));
  }

  return blockFrame('ReaderSurface', besideRegions(columns, height), width);
}
