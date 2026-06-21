import { createSurface } from '@flyingrobots/bijou';

import { BORDER } from './overlay.part01.js';

import type { Overlay } from './overlay.part01.js';

import type { CellStyle } from './overlay.part02.js';

import { backgroundStyleFromToken, mergeStyles, overlayContentFromSurface, setStyledCell, styleFromToken, withFallbackBackground } from './overlay.part03.js';

import { contentLines, lineSurface, lineWithInheritedBackground } from './overlay.part04.js';

import type { DrawerOptions } from './overlay.part06.js';

import { clampRegion, resolveDrawerDimensions } from './overlay.part08.js';
export function drawer(options: DrawerOptions): Overlay {
  const {
    content,
    screenWidth,
    screenHeight,
    title,
    ctx,
  } = options;

  const region = clampRegion(options.region, screenWidth, screenHeight);
  const dims = resolveDrawerDimensions(options, region);
  const { width, height, row, col } = dims;
  const innerWidth = Math.max(0, width - 4); // border + padding on each side

  const fillStyle = backgroundStyleFromToken(options.bgToken, ctx);
  const borderStyle = withFallbackBackground(styleFromToken(options.borderToken, ctx), fillStyle);
  const titleStyle: CellStyle = ctx ? { modifiers: ['bold'] } : {};
  const surface = createSurface(width, height);

  if (width === 0 || height === 0) {
    return { content: overlayContentFromSurface(surface, ctx), surface, row, col };
  }

  for (let x = 0; x < width; x++) {
    const topChar = x === 0 ? BORDER.tl : x === width - 1 ? BORDER.tr : BORDER.h;
    setStyledCell(surface, x, 0, topChar, borderStyle);
    if (height > 1) {
      const bottomChar = x === 0 ? BORDER.bl : x === width - 1 ? BORDER.br : BORDER.h;
      setStyledCell(surface, x, height - 1, bottomChar, borderStyle);
    }
  }

  if (title != null && width > 2) {
    const titleLine = lineSurface(title, titleStyle);
    const spanWidth = Math.min(width - 2, titleLine.width + 2);
    const startX = 1 + Math.max(0, Math.floor(((width - 2) - spanWidth) / 2));
    setStyledCell(surface, startX, 0, ' ', borderStyle);
    const mergedTitleStyle = mergeStyles(borderStyle, titleStyle);
    for (let x = 0; x < Math.min(titleLine.width, Math.max(0, spanWidth - 2)); x++) {
      setStyledCell(surface, startX + 1 + x, 0, titleLine.get(x, 0).char, mergedTitleStyle);
    }
    if (spanWidth >= 2) {
      setStyledCell(surface, startX + spanWidth - 1, 0, ' ', borderStyle);
    }
  }

  const rows = contentLines(content, innerWidth);
  const availableHeight = Math.max(0, height - 2);

  for (let i = 0; i < availableHeight; i++) {
    const y = i + 1;
    if (width >= 1) setStyledCell(surface, 0, y, BORDER.v, borderStyle);
    for (let x = 1; x < Math.max(1, width - 1); x++) {
      if (x < width - 1) setStyledCell(surface, x, y, ' ', fillStyle);
    }
    if (width >= 2) setStyledCell(surface, width - 1, y, BORDER.v, borderStyle);

    const line = lineWithInheritedBackground(rows[i] ?? createSurface(0, 1), fillStyle);
    if (line.width > 0 && innerWidth > 0 && width >= 4) {
      surface.blit(line, 2, y, 0, 0, Math.min(line.width, innerWidth), 1);
    }
  }

  return {
    content: overlayContentFromSurface(surface, ctx),
    surface,
    row,
    col,
  };
}
