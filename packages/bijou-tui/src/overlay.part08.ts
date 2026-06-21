import type { BijouContext, TokenValue } from '@flyingrobots/bijou';

import type { LayoutRect } from './layout-rect.js';

import type { OverlayContent } from './overlay.part01.js';

import type { DrawerOptions } from './overlay.part06.js';
export function resolveDrawerDimensions(
  options: DrawerOptions,
  region: LayoutRect,
): { width: number; height: number; row: number; col: number } {
  if (options.anchor === 'top' || options.anchor === 'bottom') {
    const anchor = options.anchor;
    const heightRaw = options.height;
    if (!Number.isFinite(heightRaw)) {
      throw new Error(`drawer(): "height" is required for anchor "${anchor}"`);
    }
    const height = clamp(Math.floor(heightRaw), 0, region.height);
    const width = region.width;
    const col = region.col;
    const row = anchor === 'top'
      ? region.row
      : region.row + region.height - height;
    return { width, height, row: Math.max(region.row, row), col };
  }

  const anchor = options.anchor ?? 'right';
  const widthRaw = options.width;
  if (typeof widthRaw !== 'number' || !Number.isFinite(widthRaw)) {
    throw new Error(`drawer(): "width" is required for anchor "${anchor}"`);
  }
  const width = clamp(Math.floor(widthRaw), 0, region.width);
  const height = region.height;
  const row = region.row;
  const col = anchor === 'left'
    ? region.col
    : region.col + region.width - width;
  return { width, height, row, col: Math.max(region.col, col) };
}
export function clampRegion(region: LayoutRect | undefined, screenWidth: number, screenHeight: number): LayoutRect {
  const sw = Math.floor(screenWidth);
  const sh = Math.floor(screenHeight);

  if (region == null) {
    return {
      row: 0,
      col: 0,
      width: Math.floor(Math.max(0, sw)),
      height: Math.floor(Math.max(0, sh)),
    };
  }

  const row = Math.floor(clamp(region.row, 0, Math.max(0, sh)));
  const col = Math.floor(clamp(region.col, 0, Math.max(0, sw)));
  const maxWidth = Math.max(0, sw - col);
  const maxHeight = Math.max(0, sh - row);

  return {
    row,
    col,
    width: Math.floor(clamp(region.width, 0, maxWidth)),
    height: Math.floor(clamp(region.height, 0, maxHeight)),
  };
}
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
export type TooltipDirection = 'top' | 'bottom' | 'left' | 'right';
export interface TooltipOptions {
  /** Content to display inside the tooltip. Accepts plain text or a structured surface. */
  readonly content: OverlayContent;
  /** Row of the target element (0-based). */
  readonly row: number;
  /** Column of the target element (0-based). */
  readonly col: number;
  /** Direction to place the tooltip relative to the target. Default: 'top'. */
  readonly direction?: TooltipDirection;
  /** Screen width in columns, used for clamping. */
  readonly screenWidth: number;
  /** Screen height in rows, used for clamping. */
  readonly screenHeight: number;
  /** Design token for the border color. */
  readonly borderToken?: TokenValue;
  /** Background fill token for the tooltip interior. */
  readonly bgToken?: TokenValue;
  /** Bijou context for styled output. */
  readonly ctx?: BijouContext;
}
