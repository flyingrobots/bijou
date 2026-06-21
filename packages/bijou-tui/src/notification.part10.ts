import { createSurface } from '@flyingrobots/bijou';

import type { OverflowBehavior, Surface } from '@flyingrobots/bijou';

import { createBlankLineSurface } from './notification.part09.js';
export function insetContentSurface(surface: Surface, width: number): Surface {
  const safeWidth = Math.max(1, width);
  const inset = safeWidth >= 3 ? 1 : 0;
  const innerWidth = Math.max(1, safeWidth - (inset * 2));
  const result = createSurface(safeWidth, surface.height);
  result.blit(surface, inset, 0, 0, 0, innerWidth, surface.height);
  return result;
}
export function renderInsetWrappedSurface(lineSurface: Surface, width: number): readonly Surface[] {
  const safeWidth = Math.max(1, width);
  const inset = safeWidth >= 3 ? 1 : 0;
  const innerWidth = Math.max(1, safeWidth - (inset * 2));
  return standaloneRows(lineSurface, innerWidth, 'wrap').map((row) => insetContentSurface(row, safeWidth));
}
export function clipSurfaceHeight(surface: Surface, height: number): Surface {
  const safeHeight = Math.max(0, height);
  if (surface.height <= safeHeight) return surface;
  const clipped = createSurface(surface.width, safeHeight);
  clipped.blit(surface, 0, 0, 0, 0, surface.width, safeHeight);
  return clipped;
}
export function fitLineSurface(surface: Surface, width: number): Surface {
  const safeWidth = Math.max(0, width);
  const line = createSurface(safeWidth, 1);
  if (safeWidth > 0) {
    line.blit(surface, 0, 0, 0, 0, safeWidth, 1);
  }
  return line;
}
export function wrapLineSurface(surface: Surface, width: number): readonly Surface[] {
  const safeWidth = Math.max(1, width);
  if (surface.width === 0) return [createBlankLineSurface(safeWidth)];

  const rows: Surface[] = [];
  let offset = 0;
  while (offset < surface.width) {
    const hardEnd = Math.min(surface.width, offset + safeWidth);
    const end = hardEnd >= surface.width
      ? surface.width
      : wordBoundarySurfaceEnd(surface, offset, hardEnd);
    rows.push(sliceLineSurface(surface, offset, end, safeWidth));
    offset = hardEnd >= surface.width
      ? surface.width
      : trimLeadingSurfaceWhitespace(surface, end < hardEnd ? end + 1 : hardEnd);
  }
  return rows.length === 0 ? [createBlankLineSurface(safeWidth)] : rows;
}
export function sliceLineSurface(surface: Surface, start: number, end: number, width: number): Surface {
  const row = createSurface(width, 1);
  const span = Math.max(0, Math.min(surface.width, end) - start);
  if (span > 0) {
    row.blit(surface, 0, 0, start, 0, span, 1);
  }
  return row;
}
export function wordBoundarySurfaceEnd(surface: Surface, start: number, hardEnd: number): number {
  let breakAt = -1;
  for (let index = start; index < hardEnd; index++) {
    if (isWhitespaceSurfaceCell(surface, index)) {
      breakAt = index;
    }
  }
  return breakAt > start ? breakAt : hardEnd;
}
export function trimLeadingSurfaceWhitespace(surface: Surface, start: number): number {
  let offset = start;
  while (offset < surface.width && isWhitespaceSurfaceCell(surface, offset)) {
    offset++;
  }
  return offset;
}
export function isWhitespaceSurfaceCell(surface: Surface, col: number): boolean {
  return /^\s+$/.test(surface.get(col, 0).char);
}
export function renderPlainSurface(surface: Surface): string {
  const lines: string[] = [];
  for (let y = 0; y < surface.height; y++) {
    let line = '';
    for (let x = 0; x < surface.width; x++) {
      line += surface.get(x, y).char;
    }
    lines.push(line);
  }
  return lines.join('\n');
}
export function standaloneRows(
  lineSurface: Surface,
  width: number,
  overflow: OverflowBehavior,
): readonly Surface[] {
  if (overflow === 'truncate') return [fitLineSurface(lineSurface, width)];
  return wrapLineSurface(lineSurface, width);
}
