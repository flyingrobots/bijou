import { createSurface, type BijouContext, type Surface } from '@flyingrobots/bijou';
import type { App, ScriptStep } from '@flyingrobots/bijou-tui';
import { loadOledFont } from './oled-font.js';

const FONT = loadOledFont();

const GLYPH_MAP = new Map<string, number>(FONT.lookup.map((char, index) => [char, index]));

const DEFAULT_FOREGROUND = '#f5f7ff';

const DEFAULT_BACKGROUND = '#0b1020';

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null; }

function isRgbTuple(value: unknown): value is readonly [number, number, number] {
  return Array.isArray(value) && value.length === 3 && value.every((item) => typeof item === 'number');
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function resolvedColorRgb(ref: unknown): Rgb | undefined {
  if (!isRecord(ref) || ref['kind'] !== 'resolved-color' || !isRgbTuple(ref['rgb'])) {
    return undefined;
  }
  const [r, g, b] = ref['rgb'];
  return { r, g, b };
}

function normalizeRgb(rgb: Rgb | readonly [number, number, number]): Rgb {
  if (isRgbTuple(rgb)) {
    const [r, g, b] = rgb;
    return { r, g, b };
  }
  return rgb;
}

function resolvedColorHex(ref: unknown): string | undefined {
  if (typeof ref === 'string') return ref;
  if (!isRecord(ref) || ref['kind'] !== 'resolved-color' || typeof ref['hex'] !== 'string') {
    return undefined;
  }
  return ref['hex'];
}

export interface NativeDemoSpec<Model, M = never> {
  name: string;
  app: App<Model, M>;
  steps: ScriptStep<M>[];
  outputPath: string;
  ctx?: BijouContext;
  css?: string;
  frameDelayMs?: number;
  cellWidth?: number;
  cellHeight?: number;
  foreground?: string;
  background?: string;
}

export interface RecorderResult {
  outputPath: string;
  frames: number;
  width: number;
  height: number;
}

export interface SurfaceGifOptions {
  outputPath: string;
  frames: Surface[];
  frameDelayMs?: number;
  cellWidth?: number;
  cellHeight?: number;
  foreground?: string;
  background?: string;
}

interface RasterizeOptions {
  cellWidth: number;
  cellHeight: number;
  foreground: string;
  background: string;
}

function normalizeSurfaceFrame(surface: Surface, width: number, height: number): Surface {
  if (surface.width === width && surface.height === height) {
    return surface;
  }

  const normalized = createSurface(width, height);
  normalized.blit(surface, 0, 0);
  return normalized;
}

function parseHex(hex: string): Rgb {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return { r: 255, g: 255, b: 255 };
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function mixRgb(a: Rgb, b: Rgb, ratio: number): Rgb {
  const t = Math.max(0, Math.min(1, ratio));
  return {
    r: Math.round(a.r * (1 - t) + b.r * t),
    g: Math.round(a.g * (1 - t) + b.g * t),
    b: Math.round(a.b * (1 - t) + b.b * t),
  };
}

function setPixel(rgba: Uint8Array, width: number, height: number, x: number, y: number, color: Rgb): void {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const idx = (y * width + x) * 4;
  rgba[idx] = color.r;
  rgba[idx + 1] = color.g;
  rgba[idx + 2] = color.b;
  rgba[idx + 3] = 255;
}

function fillRect(
  rgba: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  w: number,
  h: number,
  color: Rgb,
): void {
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      setPixel(rgba, width, height, x + col, y + row, color);
    }
  }
}

export type { RasterizeOptions, Rgb };
export { DEFAULT_BACKGROUND, DEFAULT_FOREGROUND, FONT, GLYPH_MAP, fillRect, mixRgb, normalizeRgb, normalizeSurfaceFrame, parseHex, resolvedColorHex, resolvedColorRgb, setPixel };
