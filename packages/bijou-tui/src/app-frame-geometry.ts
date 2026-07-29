import type { LayoutRect } from './layout-rect.js';
import { clipToWidth, visibleLength } from './viewport.js';

/** Translate a layout rect by the given row and column offsets. */
export function offsetRect(
  rect: LayoutRect,
  rowOffset: number,
  colOffset: number,
): LayoutRect {
  return {
    row: rowOffset + rect.row,
    col: colOffset + rect.col,
    width: rect.width,
    height: rect.height,
  };
}

/** Compute the available rect after reserving shell chrome rows. */
export function frameBodyRect(
  columns: number,
  rows: number,
  topRows = 1,
  bottomRows = 1,
): LayoutRect {
  const reservedTop = Math.max(0, Math.floor(topRows));
  const reservedBottom = Math.max(0, Math.floor(bottomRows));
  return {
    row: Math.min(reservedTop, Math.max(0, rows)),
    col: 0,
    width: Math.max(0, columns),
    height: Math.max(0, rows - reservedTop - reservedBottom),
  };
}

/** Clip or pad a single line to exactly `width` visible columns. */
export function fitLine(line: string, width: number): string {
  const clipped = clipToWidth(line, Math.max(0, width));
  return clipped + ' '.repeat(Math.max(0, width - visibleLength(clipped)));
}
