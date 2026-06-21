import type { SelectionOwner, SelectionPoint, SelectionRange, TableSelectionContentModel } from './selection.part01.js';

import { assertSelectionOwner, rectContainsPoint } from './selection.part06.js';

import { clamp, sliceInclusive } from './selection.part07.js';
export function pickSelectionOwner(
  owners: readonly SelectionOwner[],
  anchor: SelectionPoint,
): SelectionOwner | undefined {
  let selectedOwner: SelectionOwner | undefined;
  let selectedIndex = -1;

  owners.forEach((owner, index) => {
    assertSelectionOwner(owner, 'selection coordinator');
    if (owner.policy !== 'selectable' || !rectContainsPoint(owner.rect, anchor)) {
      return;
    }

    if (
      selectedOwner === undefined
      || owner.zIndex > selectedOwner.zIndex
      || (owner.zIndex === selectedOwner.zIndex && index > selectedIndex)
    ) {
      selectedOwner = owner;
      selectedIndex = index;
    }
  });

  return selectedOwner;
}
export function extractLineSelection(lines: readonly string[], range: SelectionRange): string {
  if (lines.length === 0) {
    return '';
  }

  const startY = Math.max(range.start.y, 0);
  const endY = Math.min(range.end.y, lines.length - 1);
  if (startY > endY) {
    return '';
  }

  const selected: string[] = [];

  for (let y = startY; y <= endY; y += 1) {
    const line = lines[y] ?? '';
    const startX = y === startY ? range.start.x : range.contentRect.x;
    const endX = y === endY
      ? range.end.x
      : range.contentRect.x + range.contentRect.width - 1;
    selected.push(sliceInclusive(line, startX, endX));
  }

  return selected.join('\n');
}
export function extractTableSelection(
  content: TableSelectionContentModel,
  range: SelectionRange,
): string {
  const rowCount = content.rows.length;
  if (rowCount === 0) {
    return '';
  }

  const delimiter = content.delimiter ?? '\t';
  const startRow = clamp(range.start.y, 0, rowCount - 1);
  const endRow = clamp(range.end.y, 0, rowCount - 1);
  const selectedRows: string[] = [];

  const startColumn = Math.min(range.start.x, range.end.x);
  const endColumn = Math.max(range.start.x, range.end.x);

  for (let rowIndex = startRow; rowIndex <= endRow; rowIndex += 1) {
    const row = content.rows[rowIndex] ?? [];
    if (row.length === 0) {
      continue;
    }

    const rowStartColumn = Math.max(startColumn, 0);
    const rowEndColumn = Math.min(endColumn, row.length - 1);
    if (rowStartColumn > rowEndColumn) {
      continue;
    }

    selectedRows.push(row.slice(rowStartColumn, rowEndColumn + 1).join(delimiter));
  }

  return selectedRows.join('\n');
}
