import type { Surface } from '../../ports/surface.js';
import type { StandardDrawInput } from './draw-input.js';
import { findSection, listedContent } from './draw-region-slots.js';
import {
  SEPARATOR_WIDTH,
  blockFrame,
  framedInnerWidth,
  regionBand,
  regionSurface,
  ruleRow,
  sideWidth,
  stackRegions,
  type BandRegion,
} from './draw-regions.js';

/**
 * Draws `AppShell` as one framed shell: navigation in a leading column beside
 * the content, the inspector in a trailing column when present, then a rule,
 * the overlays one per row, and the status row at the bottom.
 * Below 44 columns the regions stack, divided by rules, instead.
 * `bounds.sectionHeight` caps the rows of each region.
 */
export function drawAppShell(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const inner = framedInnerWidth(width);
  const height = input.bounds.sectionHeight;
  const navigation = findSection(input.sections, 'navigation');
  const content = findSection(input.sections, 'content');
  const inspector = findSection(input.sections, 'inspector');

  const navigationWidth = navigation === undefined ? 0 : sideWidth(inner, 4, 6, 24);
  const inspectorWidth = inspector === undefined ? 0 : sideWidth(inner, 3, 6, 32);
  const separators = (navigation === undefined ? 0 : 1) + (inspector === undefined ? 0 : 1);
  const contentWidth = inner - navigationWidth - inspectorWidth - (SEPARATOR_WIDTH * separators);

  const band: BandRegion[] = [];
  if (navigation !== undefined) band.push({ content: navigation.visualContent, width: navigationWidth });
  band.push({ content: content?.visualContent ?? '', width: contentWidth });
  if (inspector !== undefined) band.push({ content: inspector.visualContent, width: inspectorWidth });

  const rows: Surface[] = [regionBand(band, inner, height)];
  const overlays = findSection(input.sections, 'overlays');
  const status = findSection(input.sections, 'status');
  if (overlays !== undefined || status !== undefined) {
    rows.push(ruleRow(inner));
  }
  if (overlays !== undefined) {
    rows.push(regionSurface(listedContent(overlays, input.slots, '▸ '), inner));
  }
  if (status !== undefined) {
    rows.push(regionSurface(status.visualContent, inner));
  }

  return blockFrame('AppShell', stackRegions(rows, inner), width);
}
