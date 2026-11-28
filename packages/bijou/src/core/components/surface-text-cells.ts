import { graphemeClusterWidth, segmentGraphemes } from '../text/grapheme.js';

/**
 * The cell after a wide grapheme's lead cell. It holds no text: the lead's
 * glyph already covers it on the terminal. This is the convention
 * `writeSurfaceGrapheme` (core/render/differ-string.ts) and the packed cell
 * format (`CHAR_EMPTY`) already use.
 */
export const CONTINUATION_CELL = '';

/** One entry per cell: each grapheme, then a continuation cell for each extra column it covers. */
export function surfaceCells(text: string): string[] {
  const cells: string[] = [];
  for (const grapheme of segmentGraphemes(text)) {
    cells.push(grapheme);
    const width = Math.max(1, graphemeClusterWidth(grapheme));
    for (let column = 1; column < width; column += 1) cells.push(CONTINUATION_CELL);
  }
  return cells;
}

/**
 * Cells `start` to `end` of a cell array from `surfaceCells`, without cutting
 * a wide grapheme in half: a lead whose continuation falls outside the range,
 * or a continuation whose lead does, becomes a space.
 */
export function clipSurfaceCells(cells: readonly string[], start: number, end: number): string[] {
  const from = Math.max(0, start);
  const to = Math.max(from, Math.min(cells.length, end));
  const clipped = cells.slice(from, to);
  for (let index = 0; index < clipped.length && clipped[index] === CONTINUATION_CELL; index += 1) {
    clipped[index] = ' ';
  }
  if (cells[to] === CONTINUATION_CELL) {
    let index = clipped.length - 1;
    while (index >= 0 && clipped[index] === CONTINUATION_CELL) index -= 1;
    for (; index >= 0 && index < clipped.length; index += 1) clipped[index] = ' ';
  }
  return clipped;
}
