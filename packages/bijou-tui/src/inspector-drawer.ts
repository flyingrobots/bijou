import {
  inspector,
  type BijouContext,
  type InspectorOptions,
  type TokenValue,
} from '@flyingrobots/bijou';
import type { LayoutRect } from './layout-rect.js';
import { drawer, type Overlay } from './overlay.js';

interface InspectorDrawerBaseOptions {
  readonly inspector: InspectorOptions;
  readonly screenWidth: number;
  readonly screenHeight: number;
  readonly region?: LayoutRect;
  readonly title?: string;
  readonly borderToken?: TokenValue;
  readonly bgToken?: TokenValue;
  readonly ctx?: BijouContext;
}

interface InspectorDrawerDefaultOptions extends InspectorDrawerBaseOptions {
  readonly anchor?: undefined;
  readonly width: number;
  readonly height?: never;
}

interface InspectorDrawerHorizontalOptions extends InspectorDrawerBaseOptions {
  readonly anchor: 'left' | 'right';
  readonly width: number;
  readonly height?: never;
}

interface InspectorDrawerVerticalOptions extends InspectorDrawerBaseOptions {
  readonly anchor: 'top' | 'bottom';
  readonly height: number;
  readonly width?: never;
}

export type InspectorDrawerOptions =
  | InspectorDrawerDefaultOptions
  | InspectorDrawerHorizontalOptions
  | InspectorDrawerVerticalOptions;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clampRegion(
  region: LayoutRect | undefined,
  screenWidth: number,
  screenHeight: number,
): LayoutRect {
  if (region == null) {
    return { row: 0, col: 0, width: screenWidth, height: screenHeight };
  }

  const row = clamp(Math.floor(region.row), 0, screenHeight);
  const col = clamp(Math.floor(region.col), 0, screenWidth);
  const width = clamp(Math.floor(region.width), 0, Math.max(0, screenWidth - col));
  const height = clamp(Math.floor(region.height), 0, Math.max(0, screenHeight - row));
  return { row, col, width, height };
}

function resolveInspectorInnerWidth(options: InspectorDrawerOptions): number {
  const region = clampRegion(options.region, options.screenWidth, options.screenHeight);
  if (options.anchor === 'top' || options.anchor === 'bottom') {
    return Math.max(1, region.width - 4);
  }
  return Math.max(1, Math.floor(options.width ?? region.width) - 4);
}

/**
 * Create a drawer-attached inspector block by composing canonical inspector content
 * into a shell-owned drawer overlay.
 */
export function inspectorDrawer(options: InspectorDrawerOptions): Overlay {
  const content = inspector({
    ...options.inspector,
    chrome: 'none',
    width: options.inspector.width ?? resolveInspectorInnerWidth(options),
    borderToken: options.inspector.borderToken ?? options.borderToken,
    bgToken: options.inspector.bgToken ?? options.bgToken,
    ctx: options.inspector.ctx ?? options.ctx,
  });

  const base = {
    content,
    screenWidth: options.screenWidth,
    screenHeight: options.screenHeight,
    region: options.region,
    title: options.title,
    borderToken: options.borderToken,
    bgToken: options.bgToken,
    ctx: options.ctx,
  };

  if (options.anchor === 'top' || options.anchor === 'bottom') {
    return drawer({
      ...base,
      anchor: options.anchor,
      height: options.height,
    });
  }

  if (options.anchor === 'left' || options.anchor === 'right') {
    return drawer({
      ...base,
      anchor: options.anchor,
      width: options.width,
    });
  }

  if (options.width == null) {
    throw new Error('inspectorDrawer(): width is required for the default right anchor');
  }

  return drawer({
    ...base,
    width: options.width,
  });
}
