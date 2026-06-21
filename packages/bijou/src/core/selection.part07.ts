import type { SelectionPoint } from './selection.part01.js';
export function comparePoints(a: SelectionPoint, b: SelectionPoint): number {
  if (a.y !== b.y) {
    return a.y - b.y;
  }
  return a.x - b.x;
}
export function sliceInclusive(text: string, start: number, end: number): string {
  if (text.length === 0 || end < 0 || start > end || start >= text.length) {
    return '';
  }
  const safeStart = Math.max(0, start);
  const safeEnd = clamp(end, 0, text.length - 1);
  if (safeStart > safeEnd) {
    return '';
  }
  return text.slice(safeStart, safeEnd + 1);
}
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
export function normalizeInt(value: number | undefined, fallback: number): number {
  if (value == null || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.floor(value);
}
