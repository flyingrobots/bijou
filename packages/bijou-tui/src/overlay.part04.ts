import { FLAG_EMPTY, createSurface, isPackedSurface, parseAnsiToSurface, segmentGraphemes, stripAnsi } from '@flyingrobots/bijou';

import type { Surface } from '@flyingrobots/bijou';

import { CELL_STRIDE, FLAG_BG_SET, OFF_ALPHA, OFF_FLAGS, encodeModifiers, parseHex } from '@flyingrobots/bijou/perf';

import { clipToWidth, visibleLength } from './viewport.js';

import { resolvedColorHex, resolvedColorRgb } from './overlay.part01.js';

import type { OverlayContent } from './overlay.part01.js';

import type { CellStyle } from './overlay.part02.js';

import { setStyledGrapheme } from './overlay.part03.js';
export function lineSurface(text: string, style: CellStyle = {}): Surface {
  if (text.length === 0) return createSurface(0, 1);

  const plain = stripAnsi(text);
  const width = Math.max(0, visibleLength(text));

  if (width === 0) return createSurface(0, 1);
  if (plain !== text && style.fg == null && style.bg == null && style.modifiers == null) {
    return parseAnsiToSurface(text, width, 1);
  }

  const graphemes = segmentGraphemes(plain);
  const surface = createSurface(width, 1);
  // Pre-parse style for setRGB fast path
  let ns: { fR: number; fG: number; fB: number; bR: number; bG: number; bB: number; fl: number } | undefined;
  if (isPackedSurface(surface)) {
    let fR = -1, fG = 0, fB = 0, bR = -1, bG = 0, bB = 0;
    const fgHex = resolvedColorHex(style.fg);
    const fgRgb = style.fgRGB ?? resolvedColorRgb(style.fg) ?? (fgHex ? parseHex(fgHex) : undefined);
    if (fgRgb) { [fR, fG, fB] = fgRgb; }
    const bgHex = resolvedColorHex(style.bg);
    const bgRgb = style.bgRGB ?? resolvedColorRgb(style.bg) ?? (bgHex ? parseHex(bgHex) : undefined);
    if (bgRgb) { [bR, bG, bB] = bgRgb; }
    ns = { fR, fG, fB, bR, bG, bB, fl: style.modifiers ? encodeModifiers(style.modifiers) : 0 };
  }
  let x = 0;
  for (const grapheme of graphemes) {
    if (x >= width) break;
    x += setStyledGrapheme(surface, x, 0, grapheme, style, ns);
  }
  return surface;
}
export function lineWithInheritedBackground(line: Surface, style: Pick<CellStyle, 'bg' | 'bgRGB'>): Surface {
  if ((style.bg == null && style.bgRGB == null) || line.width === 0) return line;
  const result = line.clone();
  // Fast path: packed surface — write bg bytes directly
  const packedSurface = isPackedSurface(result) ? result : undefined;
  const bgHex = resolvedColorHex(style.bg);
  const rgb = packedSurface
    ? (style.bgRGB ?? resolvedColorRgb(style.bg) ?? (bgHex ? parseHex(bgHex) : undefined))
    : undefined;
  if (packedSurface && rgb) {
    const [bgR, bgG, bgB] = rgb;
    const buf = packedSurface.buffer;
    for (let i = 0; i < result.width; i++) {
      const off = i * CELL_STRIDE;
      const flags = buf[off + OFF_FLAGS] ?? 0;
      const alpha = buf[off + OFF_ALPHA] ?? 0;
      if (flags & FLAG_EMPTY) continue;
      if (alpha & FLAG_BG_SET) continue;
      buf[off + 5] = bgR; buf[off + 6] = bgG; buf[off + 7] = bgB;
      buf[off + OFF_ALPHA] = alpha | FLAG_BG_SET;
    }
    packedSurface.markAllDirty();
    return result;
  }
  for (let x = 0; x < result.width; x++) {
    const cell = result.get(x, 0);
    if (cell.empty) continue;
    result.set(x, 0, {
      ...cell,
      bg: cell.bg ?? style.bg,
      bgRGB: cell.bgRGB ?? style.bgRGB,
      empty: false,
    });
  }
  return result;
}
export function surfaceRows(surface: Surface, maxWidth?: number): Surface[] {
  const width = maxWidth != null ? Math.max(0, Math.min(surface.width, maxWidth)) : surface.width;
  if (surface.height <= 0) return [createSurface(width, 1)];

  const rows: Surface[] = [];
  for (let y = 0; y < surface.height; y++) {
    const row = createSurface(width, 1);
    if (width > 0) row.blit(surface, 0, 0, 0, y, width, 1);
    rows.push(row);
  }
  return rows;
}
export function contentLines(content: OverlayContent, maxWidth?: number): Surface[] {
  if (typeof content === 'string') {
    return content.split('\n').map((line) => lineSurface(maxWidth != null ? clipToWidth(line, maxWidth) : line));
  }

  return surfaceRows(content, maxWidth);
}
