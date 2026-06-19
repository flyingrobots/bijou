import { readFileSync } from 'node:fs';
import {
  rasterToGlyphSurface,
  type Surface,
} from '../../packages/bijou-tui/src/index.js';
import { rasterizeSvgToRgba, svgViewBoxAspectRatio } from './svg-raster.js';
import {
  landingBijouLogoFillColor,
  landingBijouLogoYOffset,
  paintLandingLogoOverlay,
} from './app-landing-logo-overlay.js';
import type {
  LandingTextModifiers,
  LandingThemeTokens,
} from './app-landing-types.js';

const LANDING_BIJOU_SVG_TEXT = readFileSync(new URL('../../assets/Bijou.svg', import.meta.url), 'utf8');
const LANDING_BIJOU_SVG_CHARSET = ' ░▒▓█';
const LANDING_TITLE_CELL_ASPECT_RATIO = 0.5;
const LANDING_BIJOU_SVG_ASPECT_RATIO = svgViewBoxAspectRatio(LANDING_BIJOU_SVG_TEXT);
const LANDING_BIJOU_SVG_OVERLAY_CACHE = new Map<string, Surface>();

interface BijouSvgOverlayMetrics {
  readonly left: number;
  readonly top: number;
  readonly columns: number;
  readonly rows: number;
}

export function paintV7TitleArt(
  surface: Surface,
  tokens: LandingThemeTokens,
  modifiers: LandingTextModifiers,
  timeMs: number,
): void {
  if (surface.width < 40 || surface.height < 14) return;
  paintBijouSvgOverlay(surface, tokens, modifiers, timeMs);
}

function paintBijouSvgOverlay(
  surface: Surface,
  tokens: LandingThemeTokens,
  modifiers: LandingTextModifiers,
  timeMs: number,
): void {
  const metrics = bijouSvgOverlayMetrics(surface.width, surface.height);
  if (metrics == null) return;

  const mark = getBijouSvgOverlaySurface(metrics.columns, metrics.rows);
  paintLandingLogoOverlay(surface, mark, metrics.left, metrics.top, tokens, modifiers, {
    yOffset: (x, _y, _char, width) => landingBijouLogoYOffset(x, width, timeMs),
    foreground: ({ x, width, baseForeground }) => landingBijouLogoFillColor(baseForeground, tokens, x, width, timeMs),
  });
}

function bijouSvgOverlayMetrics(width: number, height: number): BijouSvgOverlayMetrics | undefined {
  if (width < 40 || height < 14) return undefined;

  const maxColumns = Math.max(1, width - 4);
  const targetColumns = Math.max(20, Math.min(maxColumns, Math.floor(width * 0.84)));
  const maxRows = Math.max(3, Math.floor(height * 0.32));
  const rows = Math.max(
    3,
    Math.min(maxRows, Math.round((targetColumns * LANDING_TITLE_CELL_ASPECT_RATIO) / LANDING_BIJOU_SVG_ASPECT_RATIO)),
  );
  const columns = Math.max(
    12,
    Math.min(maxColumns, Math.round((rows * LANDING_BIJOU_SVG_ASPECT_RATIO) / LANDING_TITLE_CELL_ASPECT_RATIO)),
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

function getBijouSvgOverlaySurface(columns: number, rows: number): Surface {
  const key = `${String(columns)}:${String(rows)}`;
  const cached = LANDING_BIJOU_SVG_OVERLAY_CACHE.get(key);
  if (cached != null) return cached;

  const frame = rasterizeSvgToRgba(LANDING_BIJOU_SVG_TEXT, {
    width: Math.max(1, columns * 2),
    height: Math.max(1, rows * 4),
  });
  const surface = rasterToGlyphSurface(frame, {
    columns,
    rows,
    fit: 'stretch',
    colorMode: 'none',
    renderer: {
      kind: 'charset',
      chars: LANDING_BIJOU_SVG_CHARSET,
      order: 'light-to-dark',
    },
  });

  LANDING_BIJOU_SVG_OVERLAY_CACHE.set(key, surface);
  return surface;
}
