import type {
  RasterGlyphColorMode,
  RasterGlyphDitherMode,
} from '@flyingrobots/bijou-tui';
import type {
  ImageRenderMode,
  ImageViewportModel,
} from './image-viewer-contract.js';
import {
  DEFAULT_IMAGE_TUNING,
  DEFAULT_IMAGE_VIEWPORT,
  MAX_CONTRAST_PERCENT,
  MAX_THRESHOLD_PERCENT,
  MAX_ZOOM_PERCENT,
  MIN_CONTRAST_PERCENT,
  MIN_THRESHOLD_PERCENT,
  MIN_ZOOM_PERCENT,
} from './image-viewer-options.js';

export function nextMode(mode: ImageRenderMode): ImageRenderMode {
  return mode === 'braille' ? 'ascii' : 'braille';
}

export function nextColorMode(
  mode: RasterGlyphColorMode,
): RasterGlyphColorMode {
  if (mode === 'none') return 'fg-bg';
  if (mode === 'fg-bg') return 'fg';
  return 'none';
}

export function nextDitherMode(
  mode: RasterGlyphDitherMode,
): RasterGlyphDitherMode {
  return mode === 'none' ? 'ordered' : 'none';
}

export function zoomViewport(
  viewport: ImageViewportModel,
  factor: number,
): ImageViewportModel {
  return {
    ...viewport,
    zoomPercent: clampZoomPercent(Math.round(viewport.zoomPercent * factor)),
  };
}

export function panViewport(
  viewport: ImageViewportModel,
  deltaX: number,
  deltaY: number,
): ImageViewportModel {
  return {
    ...viewport,
    panX: sanitizePanValue(viewport.panX + deltaX),
    panY: sanitizePanValue(viewport.panY + deltaY),
  };
}

export function clampThresholdPercent(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_IMAGE_TUNING.thresholdPercent;
  return Math.max(
    MIN_THRESHOLD_PERCENT,
    Math.min(MAX_THRESHOLD_PERCENT, Math.round(value)),
  );
}

export function clampContrastPercent(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_IMAGE_TUNING.contrastPercent;
  return Math.max(
    MIN_CONTRAST_PERCENT,
    Math.min(MAX_CONTRAST_PERCENT, Math.round(value)),
  );
}

function clampZoomPercent(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_IMAGE_VIEWPORT.zoomPercent;
  return Math.max(MIN_ZOOM_PERCENT, Math.min(MAX_ZOOM_PERCENT, value));
}

function sanitizePanValue(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-9999, Math.min(9999, value));
}

export function formatColorMode(mode: RasterGlyphColorMode): string {
  if (mode === 'fg') return 'foreground';
  if (mode === 'fg-bg') return 'full color';
  return 'monochrome';
}

export function formatPercentSlider(
  value: number,
  min: number,
  max: number,
): string {
  const slots = 10;
  const clamped = Math.max(min, Math.min(max, value));
  const position = Math.round(((clamped - min) / (max - min)) * (slots - 1));
  let bar = '';
  for (let index = 0; index < slots; index++) {
    bar += index === position ? '|' : '-';
  }
  return `${String(value)}% [${bar}]`;
}

export function formatPan(value: number): string {
  return value > 0 ? `+${String(value)}` : String(value);
}
