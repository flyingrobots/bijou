import type { Surface } from '@flyingrobots/bijou';

import { BORDER_BOTTOM_LEFT, BORDER_BOTTOM_RIGHT, BORDER_HORIZONTAL, BORDER_TOP_LEFT, BORDER_TOP_RIGHT, BORDER_VERTICAL, COORD_SEPARATOR, DEFAULT_MAX_LABEL_WIDTH, EMPTY_FIELD, FIELD_SEPARATOR, FOCUSED_PREFIX, MIN_VISIBLE_SIZE, REGION_SEPARATOR, SIZE_SEPARATOR } from './layout-inspector.part01.js';

import type { ClippedRect, LayoutInspectorOptions, LayoutInspectorRect, LayoutInspectorRegion } from './layout-inspector.part01.js';

import { rectColumn, rectRow, scrollLabel } from './layout-inspector.part03.js';
export function clipRect(
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
export function drawBorder(surface: Surface, rect: ClippedRect): void {
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
export function drawLabel(
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
    writeChar(surface, rect.x + 1 + index, rect.y, label.charAt(index));
  }
}
export function labelForRegion(region: LayoutInspectorRegion): string {
  return region.focused === true
    ? `${FOCUSED_PREFIX}${region.id}`
    : region.id;
}
export function writeChar(surface: Surface, x: number, y: number, char: string): void {
  const current = surface.get(x, y);
  surface.set(x, y, {
    ...current,
    char,
    empty: false,
  });
}
export function regionReportLine(region: LayoutInspectorRegion): string {
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
export function field(name: string, value: string): string {
  return `${name}${FIELD_SEPARATOR}${value}`;
}
export function rectLabel(rect: LayoutInspectorRect): string {
  return [rectColumn(rect),COORD_SEPARATOR,rectRow(rect),' ',rect.width,SIZE_SEPARATOR,rect.height].join('');
}
