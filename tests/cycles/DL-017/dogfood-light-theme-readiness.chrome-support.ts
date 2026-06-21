import { expect } from 'vitest';
import type { Surface } from '@flyingrobots/bijou';
import { parseKey } from '@flyingrobots/bijou-tui';

const DRAWER_BORDER_CHARS = new Set(['┌', '┐', '└', '┘', '│', '─']);

export const KEY_F2 = parseKey('\x1bOQ');
export const KEY_DOWN = parseKey('\x1b[B');
export const KEY_ENTER = parseKey('\r');
export const KEY_ESCAPE = parseKey('\x1b');
export const KEY_CTRL_P = parseKey('\x10');
export const KEY_Q = parseKey('q');
export const MSG_CTRL_T = { type: 'key', key: 't', ctrl: true, alt: false, shift: false } as const;
export const MSG_F10 = { type: 'key', key: 'f10', ctrl: false, alt: false, shift: false } as const;

export function rightAnchoredDrawerBorderCells(surface: Surface): readonly [number, number][] {
  const startCol = Math.floor(surface.width * 0.55);
  const cells: [number, number][] = [];
  for (let y = 0; y < surface.height; y += 1) {
    for (let x = startCol; x < surface.width; x += 1) {
      if (DRAWER_BORDER_CHARS.has(surface.get(x, y).char)) {
        cells.push([x, y]);
      }
    }
  }
  expect(cells.length).toBeGreaterThan(0);
  return cells;
}

export function centeredModalBorderCells(surface: Surface, title: string): readonly [number, number][] {
  const modalTitleRow = firstBorderRowContaining(surface, title);
  const topRow = findNearestBorderRow(surface, modalTitleRow, -1);
  const bottomRow = findNearestBorderRow(surface, modalTitleRow, 1);
  const startCol = firstTopBorderCol(surface, 0, topRow);
  const endCol = lastTopBorderCol(surface, topRow);

  const cells: [number, number][] = [];
  for (let y = topRow; y <= bottomRow; y += 1) {
    for (let x = startCol; x <= endCol; x += 1) {
      if (DRAWER_BORDER_CHARS.has(surface.get(x, y).char)) {
        cells.push([x, y]);
      }
    }
  }
  expect(cells.length).toBeGreaterThan(0);
  return cells;
}

export function assertBorderCellsPaintBackground(
  surface: Surface,
  cells: readonly [number, number][],
  label: string,
): void {
  const unpainted = cells.filter(([x, y]) => {
    const cell = surface.get(x, y);
    return cell.bg == null && cell.bgRGB == null;
  });

  expect(unpainted, `${label} border cells without background`).toEqual([]);
}

export function assertTokenTextColors(
  surface: Surface,
  tokenLabel: string,
  expectedLabelFg: string,
  expectedValueFg: string,
  surfaceLabel: string,
): void {
  const labelCell = firstTextCell(surface, tokenLabel);
  expect(labelCell.cell.fg, `${surfaceLabel} ${tokenLabel} label foreground`).toBe(expectedLabelFg);

  const tokenValue = firstHexTokenCellAfter(surface, labelCell.y, labelCell.x + tokenLabel.length);
  expect(tokenValue.cell.fg, `${surfaceLabel} ${tokenLabel} value foreground`).toBe(expectedValueFg);
}

function firstTextCell(
  surface: Surface,
  text: string,
): { readonly x: number; readonly y: number; readonly cell: ReturnType<Surface['get']> } {
  for (let y = 0; y < surface.height; y += 1) {
    const line = Array.from({ length: surface.width }, (_, x) => surface.get(x, y).char).join('');
    const x = line.indexOf(text);
    if (x !== -1) {
      return { x, y, cell: surface.get(x, y) };
    }
  }
  throw new Error(`No row containing "${text}".`);
}

function firstHexTokenCellAfter(
  surface: Surface,
  y: number,
  startX: number,
): { readonly x: number; readonly y: number; readonly cell: ReturnType<Surface['get']> } {
  for (let x = Math.max(0, startX); x < surface.width; x += 1) {
    const cell = surface.get(x, y);
    if (cell.char === '#') {
      return { x, y, cell };
    }
  }
  throw new Error(`No hex token at row ${String(y)} after x ${String(startX)}.`);
}

function firstTopBorderCol(surface: Surface, start: number, row = 0): number {
  for (let x = start; x < surface.width; x += 1) {
    if (surface.get(x, row).char === '┌') return x;
  }
  throw new Error(`No top-left border from col ${String(start)} row ${String(row)}.`);
}

function lastTopBorderCol(surface: Surface, row: number): number {
  for (let x = surface.width - 1; x >= 0; x -= 1) {
    if (surface.get(x, row).char === '┐') return x;
  }
  throw new Error(`No top-right border row ${String(row)}.`);
}

function firstBorderRowContaining(surface: Surface, text: string): number {
  for (let y = 0; y < surface.height; y += 1) {
    const line = Array.from({ length: surface.width }, (_, x) => surface.get(x, y).char).join('');
    if (line.includes(text)) return y;
  }
  throw new Error(`No row containing "${text}".`);
}

function findNearestBorderRow(surface: Surface, startRow: number, step: -1 | 1): number {
  for (let y = startRow; y >= 0 && y < surface.height; y += step) {
    const expected = step === -1 ? '┌' : '└';
    if (Array.from({ length: surface.width }, (_, x) => surface.get(x, y).char).includes(expected)) {
      return y;
    }
  }
  throw new Error(`No modal border row from ${String(startRow)}.`);
}
