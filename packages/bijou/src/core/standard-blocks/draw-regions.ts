import { boxSurface } from '../components/box-v3.js';
import { separatorSurface } from '../components/separator-v3.js';
import { createTextSurface } from '../components/surface-text.js';
import type { CellTextStyle } from '../components/surface-text-style.js';
import { sanitizePlainTerminalText } from '../text/grapheme.js';
import { wrapToWidth } from '../text/wrap.js';
import { createSurface, type Surface } from '../../ports/surface.js';
import { isPlainRecord } from './schema-utils.js';
import type { RenderSection } from './render.part01.js';

/** The columns a region separator takes: a space, a rule and a space. */
const SEPARATOR_WIDTH = 3;

/** What a region holds: wrapped text, or a Surface placed as it is. */
type RegionContent = string | Surface;

/**
 * Lays `content` into a region exactly `width` columns wide. Text is
 * sanitized and wrapped; a Surface is placed as it is and clipped to the
 * region. `height`, when given, caps the rows.
 */
function regionSurface(content: RegionContent, width: number, height?: number, style: CellTextStyle = {}): Surface {
  const safeWidth = Math.max(1, Math.floor(width));
  const source = typeof content === 'string'
    ? createTextSurface(wrapText(content, safeWidth), style)
    : content;
  const rows = height === undefined ? source.height : Math.min(source.height, height);
  const region = createSurface(safeWidth, Math.max(1, rows));
  region.blit(source, 0, 0);
  return region;
}

function wrapText(text: string, width: number): string {
  const safe = sanitizePlainTerminalText(text, { preserveNewlines: true });
  return safe.split('\n').flatMap((line) => wrapToWidth(line, width)).join('\n');
}

/** Places regions side by side, divided by a vertical rule, on the same rows. */
function besideRegions(regions: readonly Surface[], height?: number): Surface {
  const natural = Math.max(1, ...regions.map((region) => region.height));
  const rows = height === undefined ? natural : Math.min(natural, height);
  const width = regions.reduce((sum, region) => sum + region.width, 0)
    + (SEPARATOR_WIDTH * Math.max(0, regions.length - 1));
  const row = createSurface(width, rows);
  let x = 0;
  regions.forEach((region, index) => {
    if (index > 0) {
      for (let y = 0; y < rows; y += 1) row.set(x + 1, y, { char: '│', empty: false });
      x += SEPARATOR_WIDTH;
    }
    row.blit(region, x, 0);
    x += region.width;
  });
  return row;
}

/** Stacks Surfaces top to bottom on a Surface exactly `width` columns wide. */
function stackRegions(surfaces: readonly Surface[], width: number): Surface {
  const height = Math.max(1, surfaces.reduce((sum, surface) => sum + surface.height, 0));
  const stacked = createSurface(width, height);
  let y = 0;
  for (const surface of surfaces) {
    stacked.blit(surface, 0, y);
    y += surface.height;
  }
  return stacked;
}

/** A plain horizontal rule, `width` columns wide. */
function ruleRow(width: number): Surface {
  return separatorSurface({ width });
}

/** The inner width of a block frame drawn `width` columns wide. */
function framedInnerWidth(width: number): number {
  return Math.max(1, width - 4);
}

/** Frames `body` in one box titled with the block name, exactly `width` columns wide. */
function blockFrame(blockName: string, body: Surface, width: number): Surface {
  return boxSurface(body, { title: blockName, width, padding: { left: 1, right: 1 } });
}

/** Side-column width: a share of the row, held between `min` and `max` columns. */
function sideWidth(inner: number, share: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(inner / share)));
}

/** The section with `id`, when the block shows it. */
function findSection(sections: readonly RenderSection[], id: string): RenderSection | undefined {
  return sections.find((section) => section.id === id);
}

/**
 * The region content of section `id`: one line per item when its slot is a
 * list of text, otherwise the section's own visual content.
 */
function listedContent(
  section: RenderSection,
  slots: Readonly<Record<string, unknown>> | undefined,
  prefix = '',
): RegionContent {
  const items = textItems(slots, section.id);
  if (items === undefined) return section.visualContent;
  return items.map((item) => `${prefix}${item}`).join('\n');
}

function textItems(slots: Readonly<Record<string, unknown>> | undefined, id: string): readonly string[] | undefined {
  if (!isPlainRecord(slots)) return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(slots, id);
  const value: unknown = descriptor !== undefined && 'value' in descriptor ? descriptor.value : undefined;
  if (!Array.isArray(value) || value.length === 0) return undefined;
  const items: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string' && typeof item !== 'number') return undefined;
    items.push(String(item));
  }
  return items;
}

export type { RegionContent };
export {
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
};
