import type { Cell, Surface } from '../../ports/surface.js';
import type { StylePort, WritePort } from '../../ports/index.js';
import { hasVisibleStyle } from './differ-cell.js';
import {
  cellAtOrEmpty,
  cellToken,
  EMPTY_CELL,
} from './safe-read.js';

export function renderDiffCells(
  current: Surface,
  target: Surface,
  io: WritePort,
  style: StylePort,
): void {
  const { width, height, cells: targetCells } = target;
  const { cells: currentCells } = current;
  let output = '';
  let cursorX = -1;
  let cursorY = -1;
  for (let y = 0; y < height; y++) {
    const targetRow = y * width;
    const currentRow = y * current.width;
    let x = 0;
    while (x < width) {
      const targetCell = cellAtOrEmpty(targetCells, targetRow + x);
      const currentCell =
        y < current.height && x < current.width
          ? cellAtOrEmpty(currentCells, currentRow + x)
          : EMPTY_CELL;
      if (sameRenderedCell(targetCell, currentCell)) {
        x++;
        continue;
      }
      if (x !== cursorX || y !== cursorY) {
        output += moveCursor(x, y);
      }
      let batchX = x;
      let batchText = '';
      while (batchX < width) {
        const cell = cellAtOrEmpty(targetCells, targetRow + batchX);
        const existing =
          y < current.height && batchX < current.width
            ? cellAtOrEmpty(currentCells, currentRow + batchX)
            : EMPTY_CELL;
        if (batchX > x && !sameRenderedStyle(cell, targetCell)) break;
        if (sameRenderedCell(cell, existing)) break;
        batchText += cell.char;
        batchX++;
      }
      output += hasVisibleStyle(targetCell)
        ? style.styled(cellToken(targetCell), batchText)
        : batchText;
      cursorX = batchX;
      cursorY = y;
      x = batchX;
    }
  }
  if (output.length > 0) io.write(output);
}

function moveCursor(x: number, y: number): string {
  return `\x1b[${String(y + 1)};${String(x + 1)}H`;
}

function sameRenderedCell(a: Cell, b: Cell): boolean {
  return (
    a === b ||
    (a.char === b.char &&
      a.fg === b.fg &&
      a.bg === b.bg &&
      a.empty === b.empty &&
      sameModifiers(a.modifiers, b.modifiers))
  );
}

function sameRenderedStyle(a: Cell, b: Cell): boolean {
  return (
    a === b ||
    (a.fg === b.fg &&
      a.bg === b.bg &&
      sameModifiers(a.modifiers, b.modifiers))
  );
}

function sameModifiers(
  left: readonly string[] | undefined,
  right: readonly string[] | undefined,
): boolean {
  const a = left ?? [];
  const b = right ?? [];
  return (
    a === b ||
    (a.length === b.length &&
      a.every((value, index) => value === b[index]))
  );
}
