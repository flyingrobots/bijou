import type { CellMask } from './surface-cell.js';

export interface TransformOptions {
  /** Character substitutions applied while transforming line art. */
  charMap?: Record<string, string>;
  /** Whether to interpolate colors instead of using nearest neighbors. */
  interpolateColors?: boolean;
  /** Cell fields affected by the transform. */
  mask?: CellMask;
}

export type Matrix3x3 = [
  number,
  number,
  number,
  number,
  number,
  number,
];

export const ROTATION_CHAR_MAP: Record<string, string> = {
  '|': '-',
  '-': '|',
  '/': '\\',
  '\\': '/',
  '┘': '┐',
  '┐': '┌',
  '┌': '└',
  '└': '┘',
  '┤': '┴',
  '┴': '├',
  '├': '┬',
  '┬': '┤',
  '▲': '▶',
  '▶': '▼',
  '▼': '◀',
  '◀': '▲',
};
