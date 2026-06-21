import { createSurface } from '@flyingrobots/bijou';

import type { Surface } from '@flyingrobots/bijou';

import { clampCenteredPosition, resolveOverlayMargin } from './design-language.js';

import { forceTextPresentation } from './icon-presentation.js';

import { BORDER } from './overlay.part01.js';

import type { ModalOptions, Overlay, ToastVariant } from './overlay.part01.js';

import type { CellStyle } from './overlay.part02.js';

import { backgroundStyleFromToken, overlayContentFromSurface, setStyledCell, styleFromToken, withFallbackBackground } from './overlay.part03.js';

import { contentLines, lineSurface, lineWithInheritedBackground, surfaceRows } from './overlay.part04.js';
export function renderBoxSurface(
  lines: readonly Surface[],
  borderStyle: CellStyle,
  fillStyle: CellStyle,
  innerWidthOverride?: number,
): Surface {
  const paintedBorderStyle = withFallbackBackground(borderStyle, fillStyle);
  const innerWidth = innerWidthOverride ?? lines.reduce((max, line) => Math.max(max, line.width), 0);
  const width = innerWidth + 4;
  const height = lines.length + 2;
  const surface = createSurface(width, height);

  setStyledCell(surface, 0, 0, BORDER.tl, paintedBorderStyle);
  for (let x = 1; x < width - 1; x++) setStyledCell(surface, x, 0, BORDER.h, paintedBorderStyle);
  setStyledCell(surface, width - 1, 0, BORDER.tr, paintedBorderStyle);

  setStyledCell(surface, 0, height - 1, BORDER.bl, paintedBorderStyle);
  for (let x = 1; x < width - 1; x++) setStyledCell(surface, x, height - 1, BORDER.h, paintedBorderStyle);
  setStyledCell(surface, width - 1, height - 1, BORDER.br, paintedBorderStyle);

  for (const [index, sourceLine] of lines.entries()) {
    const y = index + 1;
    setStyledCell(surface, 0, y, BORDER.v, paintedBorderStyle);
    for (let x = 1; x < width - 1; x++) setStyledCell(surface, x, y, ' ', fillStyle);
    setStyledCell(surface, width - 1, y, BORDER.v, paintedBorderStyle);

    const line = lineWithInheritedBackground(sourceLine, fillStyle);
    if (line.width > 0 && innerWidth > 0) {
      surface.blit(line, 2, y, 0, 0, Math.min(line.width, innerWidth), 1);
    }
  }

  return surface;
}
export function modal(options: ModalOptions): Overlay {
  const { title, body, hint, screenWidth, screenHeight, ctx } = options;

  const lines: Surface[] = [];

  if (title != null) {
    lines.push(lineSurface(title, ctx ? { modifiers: ['bold'] } : {}), createSurface(0, 1));
  }

  lines.push(...contentLines(body));

  if (hint != null) {
    lines.push(createSurface(0, 1));
    if (typeof hint === 'string') {
      lines.push(lineSurface(hint, styleFromToken(ctx?.semantic('muted'), ctx)));
    } else {
      lines.push(...surfaceRows(hint));
    }
  }

  const surface = renderBoxSurface(
    lines,
    styleFromToken(options.borderToken, ctx),
    backgroundStyleFromToken(options.bgToken, ctx),
    options.width != null ? Math.max(0, options.width - 4) : undefined,
  );
  const margin = resolveOverlayMargin(screenWidth, screenHeight, options.margin);
  const row = clampCenteredPosition(screenHeight, surface.height, margin);
  const col = clampCenteredPosition(screenWidth, surface.width, margin);

  return { content: overlayContentFromSurface(surface, ctx), surface, row, col };
}
export const TOAST_ICONS: Record<ToastVariant, string> = {
  success: forceTextPresentation('\u2714'), // ✔
  error: forceTextPresentation('\u2718'),   // ✘
  info: forceTextPresentation('\u2139'),    // ℹ
};
export const TOAST_BORDER: Record<ToastVariant, 'success' | 'error' | 'primary'> = {
  success: 'success',
  error: 'error',
  info: 'primary',
};
