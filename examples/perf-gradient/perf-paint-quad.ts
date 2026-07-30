import { createSurface } from '@flyingrobots/bijou';
import type { Model } from './perf-model.js';
import {
  fillGradient,
  fillHorizon,
  fillNoise,
} from './perf-paint-ansi.js';

let surfaces: ReturnType<typeof createSurface>[] | undefined;
let width = 0;
let height = 0;

function quadrants(
  columns: number,
  rows: number,
): ReturnType<typeof createSurface>[] {
  if (surfaces == null || width !== columns || height !== rows) {
    const halfColumns = Math.floor(columns / 2);
    const halfRows = Math.floor(rows / 2);
    surfaces = [
      createSurface(halfColumns, halfRows),
      createSurface(columns - halfColumns, halfRows),
      createSurface(halfColumns, rows - halfRows),
      createSurface(columns - halfColumns, rows - halfRows),
    ];
    width = columns;
    height = rows;
  }
  return surfaces;
}

export function fillQuad(
  target: ReturnType<typeof createSurface>,
  model: Model,
): void {
  const halfColumns = Math.floor(model.cols / 2);
  const halfRows = Math.floor(model.rows / 2);
  const [topLeft, topRight, bottomLeft, bottomRight] = quadrants(
    model.cols,
    model.rows,
  );
  if (
    topLeft == null
    || topRight == null
    || bottomLeft == null
    || bottomRight == null
  ) return;
  topLeft.fill({ char: ' ', bg: '#0a0a0a' });
  fillGradient(topRight, {
    ...model,
    cols: model.cols - halfColumns,
    rows: halfRows,
  });
  fillNoise(bottomLeft, {
    ...model,
    cols: halfColumns,
    rows: model.rows - halfRows,
  });
  fillHorizon(bottomRight, {
    ...model,
    cols: model.cols - halfColumns,
    rows: model.rows - halfRows,
  });
  target.blit(topLeft, 0, 0);
  target.blit(topRight, halfColumns, 0);
  target.blit(bottomLeft, 0, halfRows);
  target.blit(bottomRight, halfColumns, halfRows);
}
