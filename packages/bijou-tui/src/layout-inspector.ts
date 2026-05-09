import { type Surface } from '@flyingrobots/bijou';
import { type LayoutRect } from './layout-rect.js';

export interface LayoutInspectorXYRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export type LayoutInspectorRect = LayoutInspectorXYRect | LayoutRect;

export interface LayoutInspectorScroll {
  readonly x: number;
  readonly y: number;
}

export interface LayoutInspectorRegion {
  readonly id: string;
  readonly role?: string;
  readonly rect: LayoutInspectorRect;
  readonly clip?: LayoutInspectorRect;
  readonly scroll?: LayoutInspectorScroll;
  readonly focused?: boolean;
  readonly layer?: number;
}

export interface LayoutInspectorOptions {
  /** Draw region labels on the top border. Defaults to `true`. */
  readonly showLabels?: boolean;
  /** Maximum label width, before clipping to the visible region. */
  readonly maxLabelWidth?: number;
}

interface ClippedRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

const DEFAULT_MAX_LABEL_WIDTH = 32;
const MIN_VISIBLE_SIZE = 1;
const BORDER_TOP_LEFT = '+';
const BORDER_TOP_RIGHT = '+';
const BORDER_BOTTOM_LEFT = '+';
const BORDER_BOTTOM_RIGHT = '+';
const BORDER_HORIZONTAL = '-';
const BORDER_VERTICAL = '|';
const FOCUSED_PREFIX = '*';
const EMPTY_FIELD = '-';
const REGION_SEPARATOR = ' ';
const FIELD_SEPARATOR = '=';
const COORD_SEPARATOR = ',';
const SIZE_SEPARATOR = 'x';

export function layoutInspectorOverlay(
  background: Surface,
  regions: readonly LayoutInspectorRegion[],
  options: LayoutInspectorOptions = {},
): Surface {
  const surface = background.clone();
  const sortedRegions = [...regions].sort(compareRegions);

  for (const region of sortedRegions) {
    drawRegion(surface, region, options);
  }

  return surface;
}

export function layoutInspectorText(regions: readonly LayoutInspectorRegion[]): string {
  return [...regions]
    .sort(compareRegions)
    .map(regionReportLine)
    .join('\n');
}

function compareRegions(a: LayoutInspectorRegion, b: LayoutInspectorRegion): number {
  const layerDelta = (a.layer ?? 0) - (b.layer ?? 0);
  if (layerDelta !== 0) {
    return layerDelta;
  }

  return a.id.localeCompare(b.id);
}

function drawRegion(
  surface: Surface,
  region: LayoutInspectorRegion,
  options: LayoutInspectorOptions,
): void {
  const clipped = clipRect(region.rect, surface.width, surface.height);
  if (clipped === undefined) {
    return;
  }

  drawBorder(surface, clipped);

  if (options.showLabels === false) {
    return;
  }

  drawLabel(surface, clipped, region, options);
}

function clipRect(
  rect: LayoutInspectorRect,
  width: number,
  height: number,
): ClippedRect | undefined {
  const rectX = rectColumn(rect);
  const rectY = rectRow(rect);
  const left = Math.max(0, rectX);
  const top = Math.max(0, rectY);
  const right = Math.min(width, rectX + rect.width);
  const bottom = Math.min(height, rectY + rect.height);
  const clippedWidth = right - left;
  const clippedHeight = bottom - top;

  if (clippedWidth < MIN_VISIBLE_SIZE || clippedHeight < MIN_VISIBLE_SIZE) {
    return undefined;
  }

  return {
    x: left,
    y: top,
    width: clippedWidth,
    height: clippedHeight,
  };
}

function drawBorder(surface: Surface, rect: ClippedRect): void {
  const right = rect.x + rect.width - 1;
  const bottom = rect.y + rect.height - 1;

  for (let x = rect.x; x <= right; x++) {
    writeChar(surface, x, rect.y, BORDER_HORIZONTAL);
    writeChar(surface, x, bottom, BORDER_HORIZONTAL);
  }

  for (let y = rect.y; y <= bottom; y++) {
    writeChar(surface, rect.x, y, BORDER_VERTICAL);
    writeChar(surface, right, y, BORDER_VERTICAL);
  }

  writeChar(surface, rect.x, rect.y, BORDER_TOP_LEFT);
  writeChar(surface, right, rect.y, BORDER_TOP_RIGHT);
  writeChar(surface, rect.x, bottom, BORDER_BOTTOM_LEFT);
  writeChar(surface, right, bottom, BORDER_BOTTOM_RIGHT);
}

function drawLabel(
  surface: Surface,
  rect: ClippedRect,
  region: LayoutInspectorRegion,
  options: LayoutInspectorOptions,
): void {
  const writableWidth = Math.max(0, rect.width - 1);
  if (writableWidth === 0) {
    return;
  }

  const requestedMax = Math.floor(options.maxLabelWidth ?? DEFAULT_MAX_LABEL_WIDTH);
  const maxLabelWidth = Math.max(0, Math.min(writableWidth, requestedMax));
  const label = labelForRegion(region).slice(0, maxLabelWidth);

  for (let index = 0; index < label.length; index++) {
    writeChar(surface, rect.x + 1 + index, rect.y, label[index]!);
  }
}

function labelForRegion(region: LayoutInspectorRegion): string {
  return region.focused === true
    ? `${FOCUSED_PREFIX}${region.id}`
    : region.id;
}

function writeChar(surface: Surface, x: number, y: number, char: string): void {
  const current = surface.get(x, y);
  surface.set(x, y, {
    ...current,
    char,
    empty: false,
  });
}

function regionReportLine(region: LayoutInspectorRegion): string {
  return [
    region.id,
    field('role', region.role ?? EMPTY_FIELD),
    field('rect', rectLabel(region.rect)),
    field('clip', region.clip === undefined ? EMPTY_FIELD : rectLabel(region.clip)),
    field('scroll', region.scroll === undefined ? EMPTY_FIELD : scrollLabel(region.scroll)),
    field('focused', String(region.focused === true)),
    field('layer', String(region.layer ?? 0)),
  ].join(REGION_SEPARATOR);
}

function field(name: string, value: string): string {
  return `${name}${FIELD_SEPARATOR}${value}`;
}

function rectLabel(rect: LayoutInspectorRect): string {
  return `${rectColumn(rect)}${COORD_SEPARATOR}${rectRow(rect)} ${rect.width}${SIZE_SEPARATOR}${rect.height}`;
}

function scrollLabel(scroll: LayoutInspectorScroll): string {
  return `${scroll.x}${COORD_SEPARATOR}${scroll.y}`;
}

function rectColumn(rect: LayoutInspectorRect): number {
  return 'x' in rect ? rect.x : rect.col;
}

function rectRow(rect: LayoutInspectorRect): number {
  return 'y' in rect ? rect.y : rect.row;
}
