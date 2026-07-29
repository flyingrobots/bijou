import type { RgbaFrame } from '../../packages/bijou-tui/src/index.js';
import { isFilledEvenOdd, parseSvgGeometry } from './svg-geometry.js';

interface RasterizeSvgOptions {
  readonly width: number;
  readonly height: number;
  readonly padding?: number;
}

export function rasterizeSvgToRgba(
  svg: string,
  options: RasterizeSvgOptions,
): RgbaFrame {
  const width = sanitizeRasterDimension(options.width);
  const height = sanitizeRasterDimension(options.height);
  const padding = Math.max(0, options.padding ?? 0);
  const geometry = parseSvgGeometry(svg);
  const data = new Uint8ClampedArray(width * height * 4);

  if (width === 0 || height === 0) {
    return { width, height, data };
  }

  const drawableWidth = Math.max(1, width - padding * 2);
  const drawableHeight = Math.max(1, height - padding * 2);
  const scale = Math.min(
    drawableWidth / geometry.width,
    drawableHeight / geometry.height,
  );
  const offsetX = (width - geometry.width * scale) / 2;
  const offsetY = (height - geometry.height * scale) / 2;
  const transformed = geometry.polygons.map((polygon) => ({
    points: polygon.points.map((point) => ({
      x: offsetX + point.x * scale,
      y: offsetY + point.y * scale,
    })),
  }));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isFilledEvenOdd(x + 0.5, y + 0.5, transformed)) continue;

      const offset = (y * width + x) * 4;
      data[offset] = 0;
      data[offset + 1] = 0;
      data[offset + 2] = 0;
      data[offset + 3] = 255;
    }
  }

  return { width, height, data };
}

export function svgViewBoxAspectRatio(svg: string): number {
  const geometry = parseSvgGeometry(svg);
  return geometry.width / geometry.height;
}

function sanitizeRasterDimension(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.floor(value);
}
