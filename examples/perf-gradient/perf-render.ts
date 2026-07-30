import {
  MODE_COUNT,
  MODE_NAMES,
  type Model,
} from './perf-model.js';
import {
  fillGradientRgb,
  fillHorizonRgb,
  fillNoiseRgb,
} from './perf-paint-rgb.js';
import { fillQuad } from './perf-paint-quad.js';
import { renderStats } from './perf-stats.js';
import {
  getSurface,
  stampText,
} from './perf-surface.js';

export function renderFrame(model: Model) {
  const surface = getSurface(model.cols, model.rows);
  switch (model.mode) {
    case 0:
      fillGradientRgb(surface, model);
      break;
    case 1:
      fillHorizonRgb(surface, model);
      break;
    case 2:
      fillNoiseRgb(surface, model);
      break;
    case 3:
      fillQuad(surface, model);
      break;
  }
  renderStats(surface, model);
  const mode = MODE_NAMES[model.mode] ?? '?';
  const hint =
    ` space: cap │ 1-${String(MODE_COUNT)}: mode (${mode})`
    + ' │ mouse: reverse │ q: quit ';
  if (model.rows > 2 && model.cols >= hint.length + 2) {
    stampText(
      surface,
      Math.round((model.cols - hint.length) / 2),
      model.rows - 1,
      hint,
      '#888888',
      '#111111',
    );
  }
  return surface;
}
