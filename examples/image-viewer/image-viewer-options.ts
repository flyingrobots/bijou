import { extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { filePickerKeyMap } from '@flyingrobots/bijou-tui';
import type {
  ImageTuningModel,
  ImageViewerAppMsg,
  ImageViewportModel,
} from './image-viewer-contract.js';

export const DEFAULT_ASSET_ROOT = fileURLToPath(
  new URL('../../assets', import.meta.url),
);
export const DEFAULT_IMAGE_VIEWPORT: ImageViewportModel = {
  zoomPercent: 100,
  panX: 0,
  panY: 0,
};
export const DEFAULT_IMAGE_TUNING: ImageTuningModel = {
  colorMode: 'none',
  thresholdPercent: 45,
  contrastPercent: 100,
  dither: 'none',
};

export const ZOOM_FACTOR = 1.25;
export const MIN_ZOOM_PERCENT = 25;
export const MAX_ZOOM_PERCENT = 800;
export const PAN_STEP_COLUMNS = 4;
export const PAN_STEP_ROWS = 2;
export const THRESHOLD_STEP_PERCENT = 5;
export const MIN_THRESHOLD_PERCENT = 5;
export const MAX_THRESHOLD_PERCENT = 95;
export const CONTRAST_STEP_PERCENT = 10;
export const MIN_CONTRAST_PERCENT = 50;
export const MAX_CONTRAST_PERCENT = 200;

const SUPPORTED_IMAGE_EXTENSIONS = new Set(['.png', '.svg', '.ppm', '.pnm']);

export const pickerKeys = filePickerKeyMap<ImageViewerAppMsg>({
  focusNext: { type: 'focus-next' },
  focusPrev: { type: 'focus-prev' },
  enter: { type: 'enter' },
  back: { type: 'back' },
  quit: { type: 'quit' },
});

export function pickerHeight(rows: number): number {
  return Math.max(1, rows - 5);
}

export function isSupportedImagePath(path: string): boolean {
  return SUPPORTED_IMAGE_EXTENSIONS.has(extname(path).toLowerCase());
}
