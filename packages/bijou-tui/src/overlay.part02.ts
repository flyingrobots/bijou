import { FLAG_DIM, FLAG_EMPTY, isPackedSurface } from '@flyingrobots/bijou';

import type { Cell, Surface } from '@flyingrobots/bijou';

import { CELL_STRIDE, OFF_FLAGS } from '@flyingrobots/bijou/perf';

import { sliceAnsi, visibleLength } from './viewport.js';

import type { CompositeOptions, Overlay } from './overlay.part01.js';

import { surfaceFromContent } from './overlay.part09.js';
export function spliceLine(bgLine: string, overlayLine: string, col: number): string {
  const overlayVis = visibleLength(overlayLine);
  const bgVis = visibleLength(bgLine);

  const left = bgVis <= col
    ? bgLine + ' '.repeat(col - bgVis)
    : sliceAnsi(bgLine, 0, col);

  const right = sliceAnsi(bgLine, col + overlayVis, bgVis);

  return left + '\x1b[0m' + overlayLine + '\x1b[0m' + right;
}
export function composite(
  background: string,
  overlays: readonly Overlay[],
  options?: CompositeOptions,
): string {
  const bgLines = background.split('\n');

  if (options?.dim) {
    for (let i = 0; i < bgLines.length; i++) {
      const line = bgLines[i] ?? '';
      if (visibleLength(line) > 0) {
        bgLines[i] = `\x1b[2m${line}\x1b[0m`;
      }
    }
  }

  for (const overlay of overlays) {
    const oLines = overlay.content.split('\n');
    for (let i = 0; i < oLines.length; i++) {
      const targetRow = overlay.row + i;
      if (targetRow < 0 || targetRow >= bgLines.length) continue;
      bgLines[targetRow] = spliceLine(bgLines[targetRow] ?? '', oLines[i] ?? '', overlay.col);
    }
  }

  return bgLines.join('\n');
}
export function compositeSurface(
  background: Surface,
  overlays: readonly Overlay[],
  options?: CompositeOptions,
): Surface {
  const result = background.clone();
  return compositeSurfaceInto(result, result, overlays, options);
}
export function compositeSurfaceInto(
  background: Surface,
  target: Surface,
  overlays: readonly Overlay[],
  options?: CompositeOptions,
): Surface {
  if (target !== background) {
    target.clear();
    target.blit(background, 0, 0);
  }

  if (options?.dim) {
    const packed = isPackedSurface(target);
    if (packed) {
      // Fast path: set the dim flag bit directly in the buffer
      const buf = target.buffer;
      const size = target.width * target.height;
      for (let i = 0; i < size; i++) {
        const off = i * CELL_STRIDE;
        const flags = buf[off + OFF_FLAGS] ?? 0;
        if (flags & FLAG_EMPTY) continue;
        // Skip space chars (charCode 0x20)
        if ((buf[off] ?? 0) === 0x20 && (buf[off + 1] ?? 0) === 0) continue;
        buf[off + OFF_FLAGS] = flags | FLAG_DIM;
      }
      target.markAllDirty();
    } else {
      for (let y = 0; y < target.height; y++) {
        for (let x = 0; x < target.width; x++) {
          const cell = target.get(x, y);
          if (cell.empty || cell.char === ' ') continue;
          const modifiers = cell.modifiers ?? [];
          if (!modifiers.includes('dim')) {
            target.set(x, y, { ...cell, modifiers: [...modifiers, 'dim'], empty: false });
          }
        }
      }
    }
  }

  for (const overlay of overlays) {
    target.blit(overlay.surface ?? surfaceFromContent(overlay.content), overlay.col, overlay.row);
  }

  return target;
}
export type CellStyle = Pick<Cell, 'fg' | 'bg' | 'fgRGB' | 'bgRGB' | 'modifiers'>;
