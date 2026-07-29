import { createSurface, type PackedSurface } from '../ports/surface.js';
import { parsePackedBijouCellsReceipt } from './packed-bijou-cells-validate.js';

export function adaptPackedBijouCellsToSurface(input: unknown): PackedSurface {
  const receipt = parsePackedBijouCellsReceipt(input);
  const surface = createSurface(receipt.widthCells, receipt.heightCells);
  surface.buffer.set(receipt.bytes);
  surface.sideTable.splice(0, surface.sideTable.length, ...receipt.sideTable);
  surface.markAllDirty();
  for (let row = 0; row < surface.height; row += 1) {
    surface.getRow(row);
  }
  return surface;
}
