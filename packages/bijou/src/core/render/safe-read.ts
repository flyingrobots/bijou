import type { Cell } from '../../ports/surface.js';
import { colorHex } from '../theme/color.js';
import type { TextModifier, TokenValue } from '../theme/tokens.js';
import { toHex } from './packed-cell.js';

export const EMPTY_CELL: Cell = { char: ' ', empty: true };
const TEXT_MODIFIERS = new Set<string>([
  'bold', 'dim', 'strikethrough', 'inverse',
  'underline', 'curly-underline', 'dotted-underline', 'dashed-underline',
]);

export function byteAt(buf: Uint8Array, index: number): number { return buf[index] ?? 0; }

export function wordAt(buf: Uint32Array, index: number): number { return buf[index] ?? 0; }

export function rgbAt(buf: Uint8Array, index: number): readonly [number, number, number] { return [byteAt(buf, index), byteAt(buf, index + 1), byteAt(buf, index + 2)]; }

export function hexAt(buf: Uint8Array, index: number): string { return toHex(...rgbAt(buf, index)); }

export function sgrByteHex(parts: readonly string[], index: number): string {
  return parseInt(parts[index] ?? '0', 10).toString(16).padStart(2, '0');
}

export function cellAtOrEmpty(cells: readonly Cell[], index: number): Cell {
  return cells[index] ?? EMPTY_CELL;
}

export function cellAt(cells: readonly Cell[], index: number): Cell {
  const cell = cells[index];
  if (cell === undefined) throw new Error(`surface cell ${String(index)} is out of bounds`);
  return cell;
}

function cellModifiers(modifiers: readonly string[] | undefined): TextModifier[] | undefined {
  if (modifiers === undefined) return undefined;
  const normalized = modifiers.filter((modifier): modifier is TextModifier => TEXT_MODIFIERS.has(modifier));
  return normalized.length > 0 ? normalized : undefined;
}

export function cellToken(cell: Cell): TokenValue {
  return {
    hex: colorHex(cell.fg) ?? '',
    bg: colorHex(cell.bg),
    modifiers: cellModifiers(cell.modifiers),
  };
}
