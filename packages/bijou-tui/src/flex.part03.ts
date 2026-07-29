import type { BijouContext, TokenValue, Surface } from '@flyingrobots/bijou';
import { createSurface, isPackedSurface, parseAnsiToSurface, shouldApplyBg } from '@flyingrobots/bijou';
import { parseHex, CELL_STRIDE, OFF_FLAGS, OFF_ALPHA, FLAG_BG_SET, FLAG_EMPTY } from '@flyingrobots/bijou/perf';
import { clipToWidth } from './viewport.js';
import { visualWidth } from './flex.part01.js';

function alignCross(
  lines: string[],
  totalCrossSize: number,
  align: 'start' | 'center' | 'end',
  width: number,
): string[] {
  if (lines.length >= totalCrossSize) return lines.slice(0, totalCrossSize);

  const emptyLine = ' '.repeat(Math.max(0, width));
  const padding = totalCrossSize - lines.length;

  switch (align) {
    case 'start':
      return [...lines, ...Array.from<string>({ length: padding }).fill(emptyLine)];
    case 'end':
      return [...Array.from<string>({ length: padding }).fill(emptyLine), ...lines];
    case 'center': {
      const before = Math.floor(padding / 2);
      const after = padding - before;
      return [
        ...Array.from<string>({ length: before }).fill(emptyLine),
        ...lines,
        ...Array.from<string>({ length: after }).fill(emptyLine),
      ];
    }
  }
}

function resolveBackgroundColor(token: TokenValue | undefined, ctx: BijouContext | undefined): string | undefined {
  if (!token?.bg) return undefined;
  return shouldApplyBg(ctx) ? token.bg : undefined;
}

function createRegionSurface(width: number, height: number, bg: string | undefined): Surface {
  return createSurface(
    Math.max(0, width),
    Math.max(0, height),
    bg ? { char: ' ', bg, empty: false } : { char: ' ', empty: false },
  );
}

function inheritBackground(surface: Surface, bg: string | undefined): Surface {
  if (!bg || surface.width === 0 || surface.height === 0) return surface;
  const next = surface.clone();
  // Fast path: packed surface — write bg bytes directly
  const packedSurface = isPackedSurface(next) ? next : undefined;
  const rgb = packedSurface ? parseHex(bg) : undefined;
  if (packedSurface && rgb) {
    const [bgR, bgG, bgB] = rgb;
    const buf = packedSurface.buffer;
    const size = next.width * next.height;
    for (let i = 0; i < size; i++) {
      const off = i * CELL_STRIDE;
      if ((buf[off + OFF_FLAGS] ?? 0) & FLAG_EMPTY) continue;
      if ((buf[off + OFF_ALPHA] ?? 0) & FLAG_BG_SET) continue;
      buf[off + 5] = bgR; buf[off + 6] = bgG; buf[off + 7] = bgB;
      buf[off + OFF_ALPHA] = (buf[off + OFF_ALPHA] ?? 0) | FLAG_BG_SET;
    }
    packedSurface.markAllDirty();
    return next;
  }
  for (let y = 0; y < next.height; y++) {
    for (let x = 0; x < next.width; x++) {
      const cell = next.get(x, y);
      if (!cell.empty && cell.bg === undefined) {
        next.set(x, y, { ...cell, bg });
      }
    }
  }
  return next;
}

function alignOffset(total: number, size: number, align: 'start' | 'center' | 'end'): number {
  if (size >= total) return 0;
  const spare = total - size;
  switch (align) {
    case 'start':
      return 0;
    case 'end':
      return spare;
    case 'center':
      return Math.floor(spare / 2);
  }
}

function renderTextSurface(
  content: string,
  width: number,
  height: number,
  hAlign: 'start' | 'center' | 'end',
  vAlign: 'start' | 'center' | 'end',
): Surface {
  const result = createSurface(Math.max(0, width), Math.max(0, height));
  if (width <= 0 || height <= 0) return result;

  const rawLines = content.split('\n');
  const lines = rawLines
    .map((line) => {
      const vis = visualWidth(line);
      return vis > width ? clipToWidth(line, width) : line;
    })
    .slice(0, height);

  const yOffset = alignOffset(height, lines.length, vAlign);
  for (const [i, line] of lines.entries()) {
    const lineWidth = visualWidth(line);
    if (lineWidth <= 0) continue;
    const lineSurface = parseAnsiToSurface(line, lineWidth, 1);
    const xOffset = alignOffset(width, lineSurface.width, hAlign);
    result.blit(lineSurface, xOffset, yOffset + i);
  }

  return result;
}

export { alignCross, alignOffset, createRegionSurface, inheritBackground, renderTextSurface, resolveBackgroundColor };
