import { createSurface, type Cell, type Surface } from '../../ports/surface.js';
import type { CellTextStyle } from './surface-text-style.js';

export function padSurface(
  surface: Surface,
  width: number,
  height: number,
  fill?: CellTextStyle,
): Surface {
  const result =
    fill == null
      ? createSurface(width, height)
      : createSurface(width, height, {
          char: ' ',
          ...fill,
          empty: false,
        });
  result.blit(surface, 0, 0);
  return result;
}

export function wrapSurfaceToWidth(surface: Surface, width: number): Surface {
  if (width <= 0) return createSurface(0, Math.max(1, surface.height));
  if (surface.width <= width) return surface;

  const rows: Cell[][] = [];
  for (let y = 0; y < surface.height; y++) {
    let effectiveWidth = 0;
    for (let x = surface.width - 1; x >= 0; x--) {
      if (!surface.get(x, y).empty) {
        effectiveWidth = x + 1;
        break;
      }
    }
    if (effectiveWidth === 0) {
      rows.push([]);
      continue;
    }

    const cells: Cell[] = [];
    for (let x = 0; x < effectiveWidth; x++) {
      cells.push({ ...surface.get(x, y) });
    }
    for (let offset = 0; offset < cells.length; offset += width) {
      rows.push(cells.slice(offset, offset + width));
    }
  }

  const result = createSurface(width, Math.max(1, rows.length));
  rows.forEach((row, y) => {
    row.forEach((cell, x) => {
      result.set(x, y, cell);
    });
  });
  return result;
}
