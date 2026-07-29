import {
  createSurface,
  isPackedSurface,
  type PackedSurface,
} from '../ports/surface.js';
import { failPackedCells } from './packed-bijou-cells-schema.js';
import { parsePackedBijouCellsReceipt } from './packed-bijou-cells-validate.js';

export function adaptPackedBijouCellsToSurface(input: unknown): PackedSurface {
  const receipt = parsePackedBijouCellsReceipt(input);
  const surface = createSurface(receipt.widthCells, receipt.heightCells);
  if (!isPackedSurface(surface)) {
    failPackedCells(
      'invalid-shape',
      '$',
      'Bijou createSurface() did not return a packed Surface',
    );
  }
  surface.buffer.set(receipt.bytes);
  surface.sideTable.splice(0, surface.sideTable.length, ...receipt.sideTable);
  surface.markAllDirty();
  return surface;
}
