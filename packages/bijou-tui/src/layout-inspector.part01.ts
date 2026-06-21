import type { Surface } from '@flyingrobots/bijou';

import type { LayoutRect } from './layout-rect.js';

import { clipRect, drawBorder, drawLabel, regionReportLine } from './layout-inspector.part02.js';
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
  readonly maxLabelWidth?: number;
}
export interface ClippedRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
export const DEFAULT_MAX_LABEL_WIDTH = 32;
export const MIN_VISIBLE_SIZE = 1;
export const BORDER_TOP_LEFT = '+';
export const BORDER_TOP_RIGHT = '+';
export const BORDER_BOTTOM_LEFT = '+';
export const BORDER_BOTTOM_RIGHT = '+';
export const BORDER_HORIZONTAL = '-';
export const BORDER_VERTICAL = '|';
export const FOCUSED_PREFIX = '*';
export const EMPTY_FIELD = '-';
export const REGION_SEPARATOR = ' ';
export const FIELD_SEPARATOR = '=';
export const COORD_SEPARATOR = ',';
export const SIZE_SEPARATOR = 'x';
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
export function compareRegions(a: LayoutInspectorRegion, b: LayoutInspectorRegion): number {
  const layerDelta = (a.layer ?? 0) - (b.layer ?? 0);
  if (layerDelta !== 0) {
    return layerDelta;
  }

  return a.id.localeCompare(b.id);
}
export function drawRegion(
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
