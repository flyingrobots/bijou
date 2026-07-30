import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import type { ScopedNodeIO } from '@flyingrobots/bijou-node';
import { rasterToGlyphSurface } from '@flyingrobots/bijou-tui';
import { rasterizeSvgToRgba } from '../docs/svg-raster.js';
import { decodeImageRgba } from './image-codecs.js';
import type {
  ImageRenderMode,
  ImageTuningModel,
  ImageViewportModel,
  LoadedImage,
} from './image-viewer-contract.js';

export function loadImagePreview(
  selectedPath: string,
  columns: number,
  rows: number,
  mode: ImageRenderMode,
  viewport: ImageViewportModel,
  tuning: ImageTuningModel,
  io: ScopedNodeIO,
): LoadedImage | Error {
  try {
    const resolvedPath = io.resolvePath(selectedPath);
    const ext = extname(resolvedPath).toLowerCase();
    const decoded =
      ext === '.svg'
        ? {
            format: 'svg' as const,
            frame: rasterizeSvgToRgba(readFileSync(resolvedPath, 'utf8'), {
              width: Math.max(1, columns * 2),
              height: Math.max(1, rows * 4),
            }),
          }
        : decodeImageRgba(readFileSync(resolvedPath), resolvedPath);

    return {
      format: decoded.format,
      width: decoded.frame.width,
      height: decoded.frame.height,
      surface: rasterToGlyphSurface(decoded.frame, {
        columns,
        rows,
        fit: 'contain',
        cellAspectRatio: 0.5,
        zoom: viewport.zoomPercent / 100,
        panX: -viewport.panX,
        panY: -viewport.panY,
        colorMode: tuning.colorMode,
        contrast: tuning.contrastPercent / 100,
        dither: tuning.dither,
        renderer:
          mode === 'braille'
            ? {
                kind: 'braille',
                threshold: tuning.thresholdPercent / 100,
              }
            : {
                kind: 'charset',
                chars: ' .:-=+*#%@',
                order: 'light-to-dark',
              },
      }),
    };
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
}
