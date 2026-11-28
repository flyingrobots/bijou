import { boxSurface } from '../components/box-v3.js';
import { separatorSurface } from '../components/separator-v3.js';
import { createTextSurface } from '../components/surface-text.js';
import type { CellTextStyle } from '../components/surface-text-style.js';
import { sanitizePlainTerminalText } from '../text/grapheme.js';
import { wrapToWidth } from '../text/wrap.js';
import { createSurface, type Surface } from '../../ports/surface.js';

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

/** Below this inner width, regions stack instead of standing side by side. */
const STACK_BELOW = 40;

/** One region of a band: its content and its width when the band stands side by side. */
interface BandRegion {
  readonly content: RegionContent;
  readonly width: number;
}

/**
 * Lays regions side by side on the same rows when the row is wide enough,
 * or stacks them full width, divided by rules, when it is narrow, so text
 * wraps at its words instead of in a column too thin for them.
 */
function regionBand(regions: readonly BandRegion[], inner: number, height?: number): Surface {
  if (inner >= STACK_BELOW) {
    return besideRegions(regions.map((region) => regionSurface(region.content, region.width, height)), height);
  }
  const stacked = regions.flatMap((region, index) => {
    const surface = regionSurface(region.content, inner, height);
    return index === 0 ? [surface] : [ruleRow(inner), surface];
  });
  return stackRegions(stacked, inner);
}

/** Side-column width: a share of the row, held between `min` and `max` columns. */
function sideWidth(inner: number, share: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(inner / share)));
}

export type { BandRegion, RegionContent };
export {
  SEPARATOR_WIDTH,
  blockFrame,
  framedInnerWidth,
  regionBand,
  regionSurface,
  ruleRow,
  sideWidth,
  stackRegions,
};
