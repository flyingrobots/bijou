import type { BijouContext, TokenValue } from '@flyingrobots/bijou';

import type { LayoutRect } from './layout-rect.js';

import { resolveOverlayMargin } from './design-language.js';

import type { Overlay, OverlayContent, ToastOptions } from './overlay.part01.js';

import { backgroundStyleFromToken, overlayContentFromSurface, styleFromToken } from './overlay.part03.js';

import { lineSurface } from './overlay.part04.js';

import { TOAST_BORDER, TOAST_ICONS, renderBoxSurface } from './overlay.part05.js';
export function toast(options: ToastOptions): Overlay {
  const {
    message,
    variant = 'info',
    anchor = 'bottom-right',
    screenWidth,
    screenHeight,
    margin,
    ctx,
  } = options;
  const resolvedMargin = resolveOverlayMargin(screenWidth, screenHeight, margin);

  const icon = TOAST_ICONS[variant];
  const line = lineSurface(`${icon} ${message}`, styleFromToken(ctx?.semantic(variant), ctx));
  const surface = renderBoxSurface(
    [line],
    styleFromToken(ctx?.border(TOAST_BORDER[variant]), ctx),
    backgroundStyleFromToken(options.bgToken, ctx),
  );

  let row: number;
  let col: number;

  switch (anchor) {
    case 'top-right':
      row = resolvedMargin;
      col = screenWidth - surface.width - resolvedMargin;
      break;
    case 'bottom-right':
      row = screenHeight - surface.height - resolvedMargin;
      col = screenWidth - surface.width - resolvedMargin;
      break;
    case 'bottom-left':
      row = screenHeight - surface.height - resolvedMargin;
      col = resolvedMargin;
      break;
    case 'top-left':
      row = resolvedMargin;
      col = resolvedMargin;
      break;
  }

  row = Math.max(0, row);
  col = Math.max(0, col);

  return { content: overlayContentFromSurface(surface, ctx), surface, row, col };
}
export type DrawerAnchor = 'left' | 'right' | 'top' | 'bottom';
export interface DrawerBaseOptions {
  /** Content to display inside the drawer. Accepts plain text or a structured surface. */
  readonly content: OverlayContent;
  /** Screen width in columns, used for positioning. */
  readonly screenWidth: number;
  /** Screen height in rows, used for sizing. */
  readonly screenHeight: number;
  /** Optional region rectangle to attach inside, instead of full screen. */
  readonly region?: LayoutRect;
  /** Optional title displayed in the top border. */
  readonly title?: string;
  /** Design token for the border color. */
  readonly borderToken?: TokenValue;
  /** Background fill token for the drawer interior. */
  readonly bgToken?: TokenValue;
  /** Bijou context for styled output. */
  readonly ctx?: BijouContext;
}
export interface DrawerDefaultOptions extends DrawerBaseOptions {
  /** Side of the screen/region to anchor the drawer. Default: 'right'. */
  readonly anchor?: undefined;
  /** Total drawer width including borders and padding. */
  readonly width: number;
  readonly height?: never;
}
export interface DrawerHorizontalOptions extends DrawerBaseOptions {
  /** Side of the screen/region to anchor the drawer. */
  readonly anchor: 'left' | 'right';
  /** Total drawer width including borders and padding. */
  readonly width: number;
  readonly height?: never;
}
export interface DrawerVerticalOptions extends DrawerBaseOptions {
  /** Side of the screen/region to anchor the drawer. */
  readonly anchor: 'top' | 'bottom';
  /** Total drawer height including borders and padding. */
  readonly height: number;
  readonly width?: never;
}
export type DrawerOptions = DrawerDefaultOptions | DrawerHorizontalOptions | DrawerVerticalOptions;
