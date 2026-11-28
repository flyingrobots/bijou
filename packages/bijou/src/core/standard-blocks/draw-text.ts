import { createSurface, type Surface } from '../../ports/surface.js';
import { createTextSurface, tokenToCellStyle, type CellTextStyle } from '../components/surface-text.js';
import { resolveSafeCtx } from '../resolve-ctx.js';
import { sanitizePlainTerminalText, wrapToWidth } from '../text/index.js';

/** The lines of `text` with control bytes removed, each wrapped at words to `width` cells. */
export function wrappedLines(text: string, width: number): string[] {
  return sanitizePlainTerminalText(text, { preserveNewlines: true })
    .split('\n')
    .flatMap((line) => wrapToWidth(line, width));
}

/** `lines` as one Surface exactly `width` cells wide; a longer line is clipped. */
export function linesSurface(lines: readonly string[], width: number, style: CellTextStyle = {}): Surface {
  const surface = createSurface(width, Math.max(1, lines.length));
  lines.forEach((line, y) => {
    surface.blit(createTextSurface(line, style), 0, y);
  });
  return surface;
}

/** `blocks` stacked top to bottom in one Surface `width` cells wide, `gap` blank rows apart. */
export function stackBlocks(blocks: readonly Surface[], width: number, gap = 1): Surface {
  const height = blocks.reduce((sum, block) => sum + block.height, 0) + gap * Math.max(0, blocks.length - 1);
  const surface = createSurface(width, Math.max(1, height));
  let y = 0;
  for (const block of blocks) {
    surface.blit(block, 0, y);
    y += block.height + gap;
  }
  return surface;
}

/** Bold text in the theme's `tone` colour, when a default context is configured. */
export function emphasisStyle(tone: 'primary' | 'accent'): CellTextStyle {
  const style = tokenToCellStyle(resolveSafeCtx()?.semantic(tone));
  return { ...style, modifiers: [...(style.modifiers ?? []), 'bold'] };
}

/** Muted text, when a default context is configured. */
export function mutedStyle(): CellTextStyle {
  return tokenToCellStyle(resolveSafeCtx()?.semantic('muted'));
}
