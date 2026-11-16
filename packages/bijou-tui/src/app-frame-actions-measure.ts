import {
  createSurface,
  type Surface,
} from '@flyingrobots/bijou';
import { framePaneOutputToSurface } from './app-frame-render.js';
import type { FocusedPaneMeasureCache } from './app-frame-scroll-measure-cache.js';
import type { ViewOutput } from './view-output.js';

export function renderPaneSurfaceForMeasurement(
  output: ViewOutput,
  width: number,
  height: number,
  cache: FocusedPaneMeasureCache,
): Surface {
  const scratch = cache.scratch;
  const next = framePaneOutputToSurface(
    output,
    width,
    height,
    scratch?.width === width && scratch.height === height
      ? scratch
      : createSurface(width, height),
  );
  cache.scratch = next;
  return next;
}
