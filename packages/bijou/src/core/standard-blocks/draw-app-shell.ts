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
  ruleRow,
  sideWidth,
  stackRegions,
} from './draw-regions.js';

/**
 * Draws `AppShell` as one framed shell: navigation in a leading column beside
 * the content, the inspector in a trailing column when present, then a rule,
 * the overlays one per row, and the status row at the bottom.
 * `bounds.sectionHeight` caps the rows of the column band.
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

  const columns: Surface[] = [];
  if (navigation !== undefined) {
    columns.push(regionSurface(navigation.visualContent, navigationWidth, height));
  }
  columns.push(regionSurface(content?.visualContent ?? '', contentWidth, height));
  if (inspector !== undefined) {
    columns.push(regionSurface(inspector.visualContent, inspectorWidth, height));
  }

  const rows: Surface[] = [besideRegions(columns, height)];
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
