import {
  isPackedSurface,
  type Surface,
} from '../../ports/surface.js';
import type { StylePort, WritePort } from '../../ports/index.js';
import { renderDiffCells } from './differ-cells.js';
import { renderDiffPacked } from './differ-packed.js';

export { parseAnsiToSurface } from './differ-ansi.js';
export { isSameCell } from './differ-cell.js';
export { paintLayoutNode } from './differ-paint.js';
export {
  stringToSurface,
  surfaceToString,
} from './differ-string.js';

/**
 * Diff two surfaces and write the minimal set of changes to the output port.
 *
 * Packed surfaces use pooled direct UTF-8 emission when available. Other
 * surfaces retain the string-based compatibility path.
 */
export function renderDiff(
  current: Surface,
  target: Surface,
  io: WritePort,
  style: StylePort,
  outBuf?: Uint8Array,
): void {
  if (isPackedSurface(target) && isPackedSurface(current)) {
    renderDiffPacked(current, target, io, outBuf);
    return;
  }
  renderDiffCells(current, target, io, style);
}
