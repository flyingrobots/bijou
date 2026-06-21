import { CELL_STRIDE, OFF_FG_R } from './packed-cell.part01.js';
export function packedCellsEqual(buf: Uint8Array, idxA: number, idxB: number): boolean {
  const offA = idxA * CELL_STRIDE;
  const offB = idxB * CELL_STRIDE;
  for (let i = 0; i < CELL_STRIDE; i++) {
    if (buf[offA + i] !== buf[offB + i]) return false;
  }
  return true;
}
export function packedCellsEqualCross(
  bufA: Uint8Array, idxA: number,
  bufB: Uint8Array, idxB: number,
): boolean {
  const offA = idxA * CELL_STRIDE;
  const offB = idxB * CELL_STRIDE;
  for (let i = 0; i < CELL_STRIDE; i++) {
    if (bufA[offA + i] !== bufB[offB + i]) return false;
  }
  return true;
}
export function packedStyleEqual(buf: Uint8Array, idxA: number, idxB: number): boolean {
  const offA = idxA * CELL_STRIDE;
  const offB = idxB * CELL_STRIDE;
  // Compare from OFF_FG_R through end: fg RGB, bg RGB, flags (including
  // modifiers and the empty bit), and alpha (opacity + fg/bg presence).
  for (let i = OFF_FG_R; i < CELL_STRIDE; i++) {
    if (buf[offA + i] !== buf[offB + i]) return false;
  }
  return true;
}
