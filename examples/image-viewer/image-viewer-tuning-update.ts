import type { KeyMsg } from '@flyingrobots/bijou-tui';
import type {
  ImageViewerModel,
  ImageViewerUpdate,
} from './image-viewer-contract.js';
import {
  CONTRAST_STEP_PERCENT,
  DEFAULT_IMAGE_VIEWPORT,
  PAN_STEP_COLUMNS,
  PAN_STEP_ROWS,
  THRESHOLD_STEP_PERCENT,
  ZOOM_FACTOR,
} from './image-viewer-options.js';
import {
  clampContrastPercent,
  clampThresholdPercent,
  nextColorMode,
  nextDitherMode,
  nextMode,
  panViewport,
  zoomViewport,
} from './image-viewer-tuning.js';

function tuned(
  model: ImageViewerModel,
  tuning: ImageViewerModel['tuning'],
): ImageViewerUpdate {
  return [{ ...model, tuning, lastError: undefined }, []];
}

export function updateTuningKey(
  msg: KeyMsg,
  model: ImageViewerModel,
): ImageViewerUpdate | undefined {
  if (msg.key === 'm' || msg.key === 'tab') {
    return [{ ...model, mode: nextMode(model.mode), lastError: undefined }, []];
  }
  if (msg.key === 'c') {
    return tuned(model, {
      ...model.tuning,
      colorMode: nextColorMode(model.tuning.colorMode),
    });
  }
  if (msg.key === '[' || msg.key === ']') {
    const delta =
      msg.key === '[' ? -THRESHOLD_STEP_PERCENT : THRESHOLD_STEP_PERCENT;
    return tuned(model, {
      ...model.tuning,
      thresholdPercent: clampThresholdPercent(
        model.tuning.thresholdPercent + delta,
      ),
    });
  }
  if (msg.key === ',' || msg.key === '.') {
    const delta =
      msg.key === ',' ? -CONTRAST_STEP_PERCENT : CONTRAST_STEP_PERCENT;
    return tuned(model, {
      ...model.tuning,
      contrastPercent: clampContrastPercent(
        model.tuning.contrastPercent + delta,
      ),
    });
  }
  if (msg.key === 'd') {
    return tuned(model, {
      ...model.tuning,
      dither: nextDitherMode(model.tuning.dither),
    });
  }
  if (msg.key === '+' || msg.key === '=') {
    return [
      {
        ...model,
        viewport: zoomViewport(model.viewport, ZOOM_FACTOR),
        lastError: undefined,
      },
      [],
    ];
  }
  if (msg.key === '-') {
    return [
      {
        ...model,
        viewport: zoomViewport(model.viewport, 1 / ZOOM_FACTOR),
        lastError: undefined,
      },
      [],
    ];
  }
  if (msg.key === '0') {
    return [
      {
        ...model,
        viewport: DEFAULT_IMAGE_VIEWPORT,
        lastError: undefined,
      },
      [],
    ];
  }
  let panDelta: readonly [number, number] | undefined;
  if (msg.key === 'left') panDelta = [-PAN_STEP_COLUMNS, 0];
  if (msg.key === 'right') panDelta = [PAN_STEP_COLUMNS, 0];
  if (msg.key === 'up') panDelta = [0, -PAN_STEP_ROWS];
  if (msg.key === 'down') panDelta = [0, PAN_STEP_ROWS];
  if (panDelta !== undefined) {
    return [
      {
        ...model,
        viewport: panViewport(model.viewport, ...panDelta),
        lastError: undefined,
      },
      [],
    ];
  }
  return undefined;
}
