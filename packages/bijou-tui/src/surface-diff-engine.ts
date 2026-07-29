import type { Cell, Surface } from '@flyingrobots/bijou';
import type {
  SurfaceDiff,
  SurfaceDiffCell,
  SurfaceDiffCellKind,
} from './surface-diff.part01.js';

const EMPTY_CELL: Cell = Object.freeze({ char: ' ', empty: true });

export function cellAt(surface: Surface, x: number, y: number): Cell {
  if (x < 0 || y < 0 || x >= surface.width || y >= surface.height) {
    return EMPTY_CELL;
  }
  return surface.get(x, y);
}

function cellGlyphKey(cell: Cell): string {
  return `${cell.empty === true ? 'empty' : 'paint'}:${cell.char}`;
}

function cellStyleKey(cell: Cell): string {
  return JSON.stringify({
    fg: cell.fg ?? null,
    bg: cell.bg ?? null,
    fgRGB: cell.fgRGB ?? null,
    bgRGB: cell.bgRGB ?? null,
    modifiers: cell.modifiers ?? null,
    opacity: cell.opacity ?? null,
  });
}

export function diffSurfaces(before: Surface, after: Surface): SurfaceDiff {
  const width = Math.max(before.width, after.width);
  const height = Math.max(before.height, after.height);
  const cells: SurfaceDiffCell[] = [];
  let charChanges = 0;
  let styleOnlyChanges = 0;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const beforeCell = cellAt(before, x, y);
      const afterCell = cellAt(after, x, y);
      const charChanged = cellGlyphKey(beforeCell) !== cellGlyphKey(afterCell);
      const styleChanged = cellStyleKey(beforeCell) !== cellStyleKey(afterCell);
      if (!charChanged && !styleChanged) continue;

      const kind: SurfaceDiffCellKind = charChanged ? 'char' : 'style';
      if (kind === 'char') charChanges += 1;
      else styleOnlyChanges += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      cells.push({ x, y, kind, before: beforeCell, after: afterCell });
    }
  }

  return {
    width,
    height,
    beforeWidth: before.width,
    beforeHeight: before.height,
    afterWidth: after.width,
    afterHeight: after.height,
    changedCells: cells.length,
    charChanges,
    styleOnlyChanges,
    bounds:
      cells.length === 0
        ? undefined
        : {
            x: minX,
            y: minY,
            width: maxX - minX + 1,
            height: maxY - minY + 1,
          },
    cells,
  };
}
