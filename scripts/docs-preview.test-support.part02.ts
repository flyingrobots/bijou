import { rasterToGlyphSurface } from '@flyingrobots/bijou-tui';

import { rasterizeSvgToRgba, svgViewBoxAspectRatio } from '../examples/docs/svg-raster.js';

import { V7_BIJOU_LOGO_LETTER_COUNT, V7_BIJOU_LOGO_WAVE_AMPLITUDE_ROWS, V7_BIJOU_SVG_TEXT, V7_LANDING_WAKE_CHARS, V7_RASTER_TITLE_GLYPHS, V7_TITLE_CELL_ASPECT_RATIO } from './docs-preview.test-support.part01.js';

import { landingWakeLayer } from './docs-preview.test-support.part03.js';
export function titleBackgroundGlyphCount(text: string): number {
  return Array.from(text).filter((char) => V7_RASTER_TITLE_GLYPHS.has(char)).length;
}
export function stackedWakeRowCount(frame: {
  width: number;
  height: number;
  get(x: number, y: number): { char?: string };
}): number {
  let rows = 0;
  const maxY = Math.max(1, Math.floor(frame.height * 0.58));

  for (let y = 1; y < maxY; y++) {
    let line = '';
    for (let x = 0; x < frame.width; x++) {
      line += frame.get(x, y).char ?? ' ';
    }

    const full = line.indexOf('█');
    const dark = full < 0 ? -1 : line.indexOf('▓', full + 1);
    const mid = dark < 0 ? -1 : line.indexOf('▒', dark + 1);
    const light = mid < 0 ? -1 : line.indexOf('░', mid + 1);
    if (full >= 0 && dark > full && mid > dark && light > mid) {
      rows++;
    }
  }

  return rows;
}
export function bijouSvgOverlayMetrics(width: number, height: number) {
  const aspectRatio = svgViewBoxAspectRatio(V7_BIJOU_SVG_TEXT);
  const maxColumns = Math.max(1, width - 4);
  const targetColumns = Math.max(20, Math.min(maxColumns, Math.floor(width * 0.84)));
  const maxRows = Math.max(3, Math.floor(height * 0.32));
  const rows = Math.max(
    3,
    Math.min(maxRows, Math.round((targetColumns * V7_TITLE_CELL_ASPECT_RATIO) / aspectRatio)),
  );
  const columns = Math.max(
    12,
    Math.min(maxColumns, Math.round((rows * aspectRatio) / V7_TITLE_CELL_ASPECT_RATIO)),
  );
  const centerY = Math.floor(height * 0.29);
  const topLimit = Math.max(0, height - rows - 2);

  return {
    columns,
    rows,
    left: Math.max(0, Math.floor((width - columns) / 2)),
    top: Math.max(1, Math.min(topLimit, centerY - Math.floor(rows / 2))),
  };
}
export function expectedBijouSvgOverlay(width: number, height: number) {
  const metrics = bijouSvgOverlayMetrics(width, height);
  const frame = rasterizeSvgToRgba(V7_BIJOU_SVG_TEXT, {
    width: Math.max(1, metrics.columns * 2),
    height: Math.max(1, metrics.rows * 4),
  });
  const mask = rasterToGlyphSurface(frame, {
    columns: metrics.columns,
    rows: metrics.rows,
    fit: 'stretch',
    renderer: {
      kind: 'charset',
      chars: ' ░▒▓█',
      order: 'light-to-dark',
    },
  });

  return { ...metrics, mask };
}
export function expectedStackedWakeChar(x: number, y: number, width: number): string {
  const amplitudeScale = Math.max(0.35, Math.min(1.4, width / 120));
  const layer = landingWakeLayer(x, y, width, 0, amplitudeScale);
  return V7_LANDING_WAKE_CHARS[layer] ?? ' ';
}
export function expectedBijouLogoLetterIndex(x: number, width: number): number {
  const letterWidth = Math.max(1, width / V7_BIJOU_LOGO_LETTER_COUNT);
  return Math.max(0, Math.min(V7_BIJOU_LOGO_LETTER_COUNT - 1, Math.floor(x / letterWidth)));
}
export function expectedBijouLogoYOffset(x: number, width: number, timeMs: number): number {
  const letterIndex = expectedBijouLogoLetterIndex(x, width);
  return Math.round(Math.sin((timeMs * 0.004) + (letterIndex * 0.82)) * V7_BIJOU_LOGO_WAVE_AMPLITUDE_ROWS);
}
