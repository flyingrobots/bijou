import type { PackedSurface } from '@flyingrobots/bijou';

export const HEADER_FG: readonly [number, number, number] = [0xf2, 0xc5, 0x72];
export const HEADER_BG: readonly [number, number, number] = [0x1b, 0x1d, 0x3a];
export const SIDEBAR_FG: readonly [number, number, number] = [0xc8, 0xc7, 0xea];
export const SIDEBAR_BG: readonly [number, number, number] = [0x11, 0x13, 0x20];
export const BODY_FG: readonly [number, number, number] = [0x9b, 0xa9, 0xff];
export const BODY_BG: readonly [number, number, number] = [0x17, 0x1a, 0x28];
export const FOOTER_FG: readonly [number, number, number] = [0x4b, 0x5d, 0x8a];
export const FOOTER_BG: readonly [number, number, number] = [0x10, 0x13, 0x1f];

export const BLOCK = 0x2588;
export const H_BAR = 0x2500;
export const V_BAR = 0x2502;
export const SHADE = 0x2592;

export const SOAK_COLUMNS = 220;
export const SOAK_ROWS = 58;
export const HEADER_ROWS = 2;
export const SIDEBAR_COLUMNS = 20;
export const FOOTER_ROWS = 1;

export function paintSoakBase(
  target: PackedSurface,
  columns: number,
  rows: number,
): void {
  for (let x = 0; x < columns; x++) {
    target.setRGB(x, 0, H_BAR, ...HEADER_FG, ...HEADER_BG);
    target.setRGB(x, 1, BLOCK, ...HEADER_FG, ...HEADER_BG);
  }

  for (let y = HEADER_ROWS; y < rows - FOOTER_ROWS; y++) {
    for (let x = 0; x < SIDEBAR_COLUMNS; x++) {
      target.setRGB(x, y, BLOCK, ...SIDEBAR_FG, ...SIDEBAR_BG);
    }
    target.setRGB(SIDEBAR_COLUMNS, y, V_BAR, ...SIDEBAR_FG, ...BODY_BG);
  }

  const bodyStartX = SIDEBAR_COLUMNS + 1;
  const bodyEndY = rows - FOOTER_ROWS - 1;
  for (let y = HEADER_ROWS + 1; y <= bodyEndY; y++) {
    for (let x = bodyStartX; x < columns; x++) {
      target.setRGB(x, y, SHADE, ...BODY_FG, ...BODY_BG);
    }
  }

  for (let x = 0; x < columns; x++) {
    target.setRGB(x, rows - 1, BLOCK, ...FOOTER_FG, ...FOOTER_BG);
  }
}
