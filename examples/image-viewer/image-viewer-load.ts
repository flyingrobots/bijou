import { readFileSync, statSync } from 'node:fs';
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

const IMAGE_PREVIEW_CACHE_LIMIT = 16;
const imagePreviewCache = new Map<string, LoadedImage>();

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
    const stats = statSync(resolvedPath, { bigint: true });
    const cacheKey = [
      resolvedPath,
      stats.mtimeNs.toString(),
      stats.size.toString(),
      String(columns),
      String(rows),
      mode,
      String(viewport.zoomPercent),
      String(viewport.panX),
      String(viewport.panY),
      tuning.colorMode,
      String(tuning.thresholdPercent),
      String(tuning.contrastPercent),
      tuning.dither,
    ].join('\0');
    const cached = imagePreviewCache.get(cacheKey);
    if (cached != null) {
      imagePreviewCache.delete(cacheKey);
      imagePreviewCache.set(cacheKey, cached);
      return cached;
    }
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

    const loaded: LoadedImage = {
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
    if (imagePreviewCache.size >= IMAGE_PREVIEW_CACHE_LIMIT) {
      const oldest = imagePreviewCache.keys().next().value;
      if (oldest != null) imagePreviewCache.delete(oldest);
    }
    imagePreviewCache.set(cacheKey, loaded);
    return loaded;
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
}
