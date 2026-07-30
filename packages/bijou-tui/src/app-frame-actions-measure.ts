import {
  createSurface,
  type Surface,
} from '@flyingrobots/bijou';
import { framePaneOutputToSurface } from './app-frame-render.js';
import type { ViewOutput } from './view-output.js';

let focusedPaneMeasureScratch: Surface | null = null;

export function renderPaneSurfaceForMeasurement(
  output: ViewOutput,
  width: number,
  height: number,
): Surface {
  const scratch = focusedPaneMeasureScratch;
  focusedPaneMeasureScratch = framePaneOutputToSurface(
    output,
    width,
    height,
    scratch?.width === width && scratch.height === height
      ? scratch
      : createSurface(width, height),
  );
  return focusedPaneMeasureScratch;
}
