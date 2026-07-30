import {
  FULL_MASK,
  type Cell,
} from './surface-cell.js';
import type { PackedSurface } from './surface-contract.js';
import { blitSurface, transformSurface } from './surface-packed-compose.js';
import {
  copySurfaceIntoClone,
  getSurfaceCell,
  getSurfaceRow,
  setSurfaceRow,
} from './surface-packed-read.js';
import {
  createPackedSurfaceState,
  markAllDirty,
  markAllRenderClean,
} from './surface-packed-state.js';
import {
  clearSurface,
  fillSurface,
  setSurfaceCell,
  setSurfaceRgb,
} from './surface-packed-write.js';

export function createSurface(
  width: number,
  height: number,
  fill?: Cell,
): PackedSurface {
  const state = createPackedSurfaceState(width, height, fill);
  const surface: PackedSurface = {
    width: state.width,
    height: state.height,
    cells: state.cells,
    buffer: state.buffer,
    sideTable: state.sideTable,
    renderDirtyWords: state.renderDirtyWords,
    markAllDirty: () => {
      markAllDirty(state);
    },
    markAllRenderClean: () => {
      markAllRenderClean(state);
    },
    clear: () => {
      clearSurface(state);
    },
    get: (x, y, mask = FULL_MASK) => getSurfaceCell(state, x, y, mask),
    set: (x, y, cell, mask = FULL_MASK) => {
      setSurfaceCell(state, x, y, cell, mask);
    },
    setRGB: (
      x,
      y,
      char,
      foregroundRed,
      foregroundGreen,
      foregroundBlue,
      backgroundRed,
      backgroundGreen,
      backgroundBlue,
      flags = 0,
    ) => {
      setSurfaceRgb(
        state,
        x,
        y,
        char,
        foregroundRed,
        foregroundGreen,
        foregroundBlue,
        backgroundRed,
        backgroundGreen,
        backgroundBlue,
        flags,
      );
    },
    fill: (
      cell,
      x = 0,
      y = 0,
      regionWidth = state.width,
      regionHeight = state.height,
      mask = FULL_MASK,
    ) => {
      fillSurface(
        state,
        cell,
        x,
        y,
        regionWidth,
        regionHeight,
        mask,
      );
    },
    blit: (
      source,
      x,
      y,
      sourceX = 0,
      sourceY = 0,
      sourceWidth = source.width,
      sourceHeight = source.height,
      mask = FULL_MASK,
    ) => {
      blitSurface(
        state,
        source,
        x,
        y,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        mask,
      );
    },
    transform: (source, matrix, options = {}) => {
      transformSurface(state, source, matrix, options);
    },
    getRow: (y, x = 0, rowWidth = state.width - x, mask = FULL_MASK) =>
      getSurfaceRow(state, y, x, rowWidth, mask),
    setRow: (y, cells, x = 0, mask = FULL_MASK) => {
      setSurfaceRow(state, y, cells, x, mask);
    },
    clone: () =>
      copySurfaceIntoClone(
        state,
        createSurface(state.width, state.height),
      ),
  };
  return surface;
}
