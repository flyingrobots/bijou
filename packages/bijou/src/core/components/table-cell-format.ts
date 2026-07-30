import { wrapToWidth } from '../text/wrap.js';
import type {
  TableWrapMode,
} from './table-contract.js';
import type { OverflowBehavior } from './types.js';
import {
  clipCellToWidth,
  wrapCellToWidth,
} from './table-text-ansi.js';

export function formatCellLines(
  value: string,
  width: number,
  overflow: OverflowBehavior,
  wrapMode: TableWrapMode,
): string[] {
  if (overflow === 'truncate') {
    return value.split('\n').map((line) => clipCellToWidth(line, width));
  }
  if (wrapMode === 'word') return wrapToWidth(value, width);
  return value.split('\n').flatMap((line) => wrapCellToWidth(line, width));
}
