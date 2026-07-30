import { basename } from 'node:path';
import type { BijouContext } from '@flyingrobots/bijou';
import { boxSurface, stringToSurface, type Surface } from '@flyingrobots/bijou';
import type { ScopedNodeIO } from '@flyingrobots/bijou-node';
import { placeSurface, vstackSurface } from '@flyingrobots/bijou-tui';
import type {
  ImageViewerModel,
  LoadedImage,
} from './image-viewer-contract.js';
import { loadImagePreview } from './image-viewer-load.js';
import {
  MAX_CONTRAST_PERCENT,
  MAX_THRESHOLD_PERCENT,
  MIN_CONTRAST_PERCENT,
  MIN_THRESHOLD_PERCENT,
} from './image-viewer-options.js';
import {
  formatColorMode,
  formatPan,
  formatPercentSlider,
} from './image-viewer-tuning.js';

function loadedStatus(
  model: ImageViewerModel,
  loaded: LoadedImage,
): string {
  const threshold = formatPercentSlider(
    model.tuning.thresholdPercent,
    MIN_THRESHOLD_PERCENT,
    MAX_THRESHOLD_PERCENT,
  );
  const contrast = formatPercentSlider(
    model.tuning.contrastPercent,
    MIN_CONTRAST_PERCENT,
    MAX_CONTRAST_PERCENT,
  );
  return [
    `Mode: ${model.mode}`,
    `Format: ${loaded.format.toUpperCase()}`,
    `Source: ${String(loaded.width)}x${String(loaded.height)}`,
    `Zoom: ${String(model.viewport.zoomPercent)}%`,
    `Pan: ${formatPan(model.viewport.panX)},${formatPan(model.viewport.panY)}`,
    `Color: ${formatColorMode(model.tuning.colorMode)}`,
    `Dither: ${model.tuning.dither}`,
    `Threshold: ${threshold}`,
    `Contrast: ${contrast}`,
  ].join('  ');
}

export function renderPreview(
  model: ImageViewerModel,
  width: number,
  height: number,
  ctx: BijouContext,
  io: ScopedNodeIO,
): Surface {
  const footer = [
    'Explorer: j/k focus  Enter select/open  Backspace parent',
    'Preview: arrows pan  +/- zoom  0 fit  m mode  c color  d dither  [] threshold  ,. contrast',
  ].join('  ');
  const previewHeight = Math.max(1, height - 5);
  const previewWidth = Math.max(1, width - 2);
  let title = 'Preview';
  let body: Surface;
  let status = 'No image selected.';

  if (model.selectedPath === undefined) {
    body = stringToSurface(
      'No supported image selected.',
      previewWidth,
      previewHeight,
    );
  } else {
    title = basename(model.selectedPath);
    const loaded = loadImagePreview(
      model.selectedPath,
      previewWidth,
      previewHeight,
      model.mode,
      model.viewport,
      model.tuning,
      io,
    );
    if (loaded instanceof Error) {
      status = loaded.message;
      body = stringToSurface(status, previewWidth, previewHeight);
    } else {
      status = loadedStatus(model, loaded);
      body = loaded.surface;
    }
  }
  if (model.lastError !== undefined) status = model.lastError;

  return placeSurface(
    vstackSurface(
      boxSurface(
        placeSurface(body, {
          width: previewWidth,
          height: previewHeight,
          hAlign: 'center',
          vAlign: 'middle',
        }),
        { title, width, ctx },
      ),
      stringToSurface(status, width, 1),
      stringToSurface(footer, width, 1),
    ),
    { width, height },
  );
}
