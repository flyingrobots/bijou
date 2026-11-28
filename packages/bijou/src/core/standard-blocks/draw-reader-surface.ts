import type { Surface } from '../../ports/surface.js';
import type { StandardDrawInput } from './draw-input.js';
import { findSection, listedContent } from './draw-region-slots.js';
import { SEPARATOR_WIDTH, blockFrame, framedInnerWidth, regionBand, sideWidth, type BandRegion } from './draw-regions.js';

/**
 * Draws `ReaderSurface` as one framed reading view: navigation in a leading
 * column, the content in the middle, and the outline, one heading per row,
 * in a trailing column. Below 44 columns the regions stack, divided by
 * rules, instead. `bounds.sectionHeight` caps the rows of each region.
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

  const band: BandRegion[] = [];
  if (navigation !== undefined) band.push({ content: navigation.visualContent, width: navigationWidth });
  band.push({ content: content?.visualContent ?? '', width: contentWidth });
  if (outline !== undefined) band.push({ content: listedContent(outline, input.slots), width: outlineWidth });

  return blockFrame('ReaderSurface', regionBand(band, inner, height), width);
}
