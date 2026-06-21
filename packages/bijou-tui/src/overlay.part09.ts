import { parseAnsiToSurface } from '@flyingrobots/bijou';

import type { Surface } from '@flyingrobots/bijou';

import { visibleLength } from './viewport.js';

import type { Overlay } from './overlay.part01.js';

import { backgroundStyleFromToken, overlayContentFromSurface, styleFromToken } from './overlay.part03.js';

import { contentLines } from './overlay.part04.js';

import { renderBoxSurface } from './overlay.part05.js';

import type { TooltipOptions } from './overlay.part08.js';
export function tooltip(options: TooltipOptions): Overlay {
  const {
    content,
    row: targetRow,
    col: targetCol,
    direction = 'top',
    screenWidth,
    screenHeight,
    borderToken,
    bgToken,
    ctx,
  } = options;

  const maxContentWidth = Math.max(0, screenWidth - 4);
  const lines = contentLines(content, maxContentWidth);
  const surface = renderBoxSurface(
    lines,
    styleFromToken(borderToken, ctx),
    backgroundStyleFromToken(bgToken, ctx),
  );

  let tipRow: number;
  let tipCol: number;

  switch (direction) {
    case 'top':
      tipRow = targetRow - surface.height;
      tipCol = targetCol - Math.floor(surface.width / 2);
      break;
    case 'bottom':
      tipRow = targetRow + 1;
      tipCol = targetCol - Math.floor(surface.width / 2);
      break;
    case 'left':
      tipRow = targetRow - Math.floor(surface.height / 2);
      tipCol = targetCol - surface.width;
      break;
    case 'right':
      tipRow = targetRow - Math.floor(surface.height / 2);
      tipCol = targetCol + 1;
      break;
  }

  // Clamp to screen bounds
  tipRow = Math.max(0, Math.min(tipRow, screenHeight - surface.height));
  tipCol = Math.max(0, Math.min(tipCol, screenWidth - surface.width));

  return { content: overlayContentFromSurface(surface, ctx), surface, row: tipRow, col: tipCol };
}
export function surfaceFromContent(content: string): Surface {
  const lines = content.split('\n');
  const width = Math.max(1, ...lines.map((line) => visibleLength(line)));
  const height = Math.max(1, lines.length);
  return parseAnsiToSurface(content, width, height);
}
