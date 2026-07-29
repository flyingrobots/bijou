import { type Cell, type Surface } from '@flyingrobots/bijou';
import { type SurfaceDiff } from './surface-diff.part01.js';
import { cellAt } from './surface-diff-engine.js';

export function surfaceRow(surface: Surface, y: number, width: number): string {
  let row = '';
  for (let x = 0; x < width; x++) {
    row += glyph(cellAt(surface, x, y));
  }
  return row;
}
export function glyph(cell: Cell): string {
  return cell.empty === true || cell.char === '' ? ' ' : cell.char;
}
export function summary(diff: SurfaceDiff): string {
  return [
    'surface diff:',
    diff.changedCells,
    'changed,',
    diff.charChanges,
    'char,',
    diff.styleOnlyChanges,
    'style',
  ].join(' ');
}
export function bounds(diff: SurfaceDiff): string {
  if (diff.bounds === undefined) return 'bounds: none';
  return [
    'bounds: x=',
    diff.bounds.x,
    ' y=',
    diff.bounds.y,
    ' w=',
    diff.bounds.width,
    ' h=',
    diff.bounds.height,
  ].join('');
}
export function quoteChar(cell: Cell): string {
  return JSON.stringify(glyph(cell));
}
export function styleLabel(cell: Cell): string {
  return [
    `fg=${colorLabel(cell.fg)}`,
    `bg=${colorLabel(cell.bg)}`,
    `fgRGB=${rgbLabel(cell.fgRGB)}`,
    `bgRGB=${rgbLabel(cell.bgRGB)}`,
    `modifiers=${cell.modifiers?.join('+') ?? 'none'}`,
    `opacity=${cell.opacity?.toString() ?? 'default'}`,
  ].join(' ');
}
export function xy(x: number, y: number): string {
  return [x, y].join(',');
}
export function colorLabel(value: Cell['fg']): string {
  if (value == null) return 'default';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}
export function rgbLabel(value: Cell['fgRGB']): string {
  return value === undefined ? 'default' : value.join(',');
}
