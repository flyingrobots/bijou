import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { createRequire } from 'node:module';
import { createSurface, sanitizePositiveInt, type BijouContext, type Surface } from '@flyingrobots/bijou';
import { runScript, type App, type ScriptStep } from '@flyingrobots/bijou-tui';

const require = createRequire(import.meta.url);
const { GIFEncoder, applyPalette, quantize } = require('gifenc') as typeof import('gifenc');
const FONT = require('oled-font-5x7') as {
  width: number;
  height: number;
  fontData: number[];
  lookup: string[];
};

const GLYPH_MAP = new Map<string, number>(FONT.lookup.map((char, index) => [char, index]));
const DEFAULT_FOREGROUND = '#f5f7ff';
const DEFAULT_BACKGROUND = '#0b1020';

function resolvedColorRgb(ref: unknown): Rgb | undefined {
  if (typeof ref !== 'object' || ref == null) return undefined;
  if (!('kind' in ref) || (ref as { kind?: unknown }).kind !== 'resolved-color') return undefined;
  if (!('rgb' in ref)) return undefined;
  const rgb = (ref as { rgb: readonly [number, number, number] }).rgb;
  return { r: rgb[0]!, g: rgb[1]!, b: rgb[2]! };
}

function normalizeRgb(rgb: Rgb | readonly [number, number, number]): Rgb {
  return Array.isArray(rgb)
    ? { r: rgb[0]!, g: rgb[1]!, b: rgb[2]! }
    : (rgb as Rgb);
}

function resolvedColorHex(ref: unknown): string | undefined {
  if (typeof ref === 'string') return ref;
  return typeof ref === 'object'
    && ref !== null
    && 'kind' in ref
    && (ref as { kind?: unknown }).kind === 'resolved-color'
    && 'hex' in ref
    ? (ref as { hex: string }).hex
    : undefined;
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

export async function recordDemoGif<Model, M = never>(
  spec: NativeDemoSpec<Model, M>,
): Promise<RecorderResult> {
  const result = await runScript(spec.app, spec.steps, {
    ctx: spec.ctx,
    css: spec.css,
  });

  return writeSurfaceGif({
    outputPath: spec.outputPath,
    frames: result.frames,
    frameDelayMs: spec.frameDelayMs,
    cellWidth: spec.cellWidth,
    cellHeight: spec.cellHeight,
    foreground: spec.foreground,
    background: spec.background,
  });
}

export function writeSurfaceGif(options: SurfaceGifOptions): RecorderResult {
  if (options.frames.length === 0) {
    throw new Error('writeSurfaceGif() requires at least one frame');
  }

  const rasterOptions: RasterizeOptions = {
    cellWidth: sanitizePositiveInt(options.cellWidth, 8),
    cellHeight: sanitizePositiveInt(options.cellHeight, 10),
    foreground: options.foreground ?? DEFAULT_FOREGROUND,
    background: options.background ?? DEFAULT_BACKGROUND,
  };

  const width = Math.max(...options.frames.map((frame) => frame.width));
  const height = Math.max(...options.frames.map((frame) => frame.height));
  const frames = options.frames
    .map((frame) => normalizeSurfaceFrame(frame, width, height))
    .map((frame) => rasterizeSurface(frame, rasterOptions));
  const palette = quantize(joinFrames(frames), 256, { format: 'rgb565' });
  const gif = GIFEncoder();
  const delay = Math.max(2, Math.round(sanitizePositiveInt(options.frameDelayMs, 90) / 10));

  for (const frame of frames) {
    const indexed = applyPalette(frame, palette);
    gif.writeFrame(indexed, width * rasterOptions.cellWidth, height * rasterOptions.cellHeight, {
      palette,
      delay,
    });
  }

  gif.finish();
  mkdirSync(dirname(options.outputPath), { recursive: true });
  writeFileSync(options.outputPath, Buffer.from(gif.bytes()));

  return {
    outputPath: options.outputPath,
    frames: frames.length,
    width: width * rasterOptions.cellWidth,
    height: height * rasterOptions.cellHeight,
  };
}

export function rasterizeSurface(surface: Surface, options?: Partial<RasterizeOptions>): Uint8Array {
  const cellWidth = sanitizePositiveInt(options?.cellWidth, 8);
  const cellHeight = sanitizePositiveInt(options?.cellHeight, 10);
  const foreground = options?.foreground ?? DEFAULT_FOREGROUND;
  const background = options?.background ?? DEFAULT_BACKGROUND;
  const width = surface.width * cellWidth;
  const height = surface.height * cellHeight;
  const rgba = new Uint8Array(width * height * 4);

  for (let y = 0; y < surface.height; y++) {
    for (let x = 0; x < surface.width; x++) {
      drawCell(rgba, width, height, x, y, cellWidth, cellHeight, surface.get(x, y), foreground, background);
    }
  }

  return rgba;
}

function drawCell(
  rgba: Uint8Array,
  width: number,
  height: number,
  cellX: number,
  cellY: number,
  cellWidth: number,
  cellHeight: number,
  cell: Surface['cells'][number],
  fallbackForeground: string,
  fallbackBackground: string,
): void {
  const modifiers = new Set(cell.modifiers ?? []);
  const fgHex = resolvedColorHex(cell.fg);
  const bgHex = resolvedColorHex(cell.bg);
  let fg = normalizeRgb(cell.fgRGB ?? resolvedColorRgb(cell.fg) ?? parseHex(fgHex ?? fallbackForeground));
  let bg = normalizeRgb(cell.bgRGB ?? resolvedColorRgb(cell.bg) ?? parseHex(bgHex ?? fallbackBackground));

  if (modifiers.has('inverse')) {
    [fg, bg] = [bg, fg];
  }
  if (modifiers.has('dim')) {
    fg = mixRgb(fg, bg, 0.45);
  }

  const pixelX = cellX * cellWidth;
  const pixelY = cellY * cellHeight;
  fillRect(rgba, width, height, pixelX, pixelY, cellWidth, cellHeight, bg);

  if (cell.empty || cell.char === ' ') {
    return;
  }

  const drawn = drawSpecialGlyph(rgba, width, height, pixelX, pixelY, cellWidth, cellHeight, cell.char, fg);
  if (!drawn) {
    drawBitmapGlyph(rgba, width, height, pixelX + 1, pixelY + 1, cell.char, fg);
  }

  if (modifiers.has('bold')) {
    const boldDrawn = drawSpecialGlyph(rgba, width, height, pixelX + 1, pixelY, cellWidth, cellHeight, cell.char, fg);
    if (!boldDrawn) {
      drawBitmapGlyph(rgba, width, height, pixelX + 2, pixelY + 1, cell.char, fg);
    }
  }
  if (modifiers.has('underline')) {
    fillRect(rgba, width, height, pixelX + 1, pixelY + cellHeight - 2, cellWidth - 2, 1, fg);
  }
  if (modifiers.has('strike')) {
    fillRect(rgba, width, height, pixelX + 1, pixelY + Math.floor(cellHeight / 2), cellWidth - 2, 1, fg);
  }
}

function drawBitmapGlyph(
  rgba: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  char: string,
  color: Rgb,
): void {
  const glyphIndex = GLYPH_MAP.get(char);
  if (glyphIndex == null) {
    fillRect(rgba, width, height, x + 1, y + 2, 3, 3, color);
    return;
  }

  const offset = glyphIndex * FONT.width;
  for (let col = 0; col < FONT.width; col++) {
    const bits = FONT.fontData[offset + col] ?? 0;
    for (let row = 0; row < FONT.height; row++) {
      if (((bits >> row) & 1) === 1) {
        setPixel(rgba, width, height, x + col, y + row, color);
      }
    }
  }
}

function drawSpecialGlyph(
  rgba: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  cellWidth: number,
  cellHeight: number,
  char: string,
  color: Rgb,
): boolean {
  const midX = x + Math.floor(cellWidth / 2);
  const midY = y + Math.floor(cellHeight / 2);
  const right = x + cellWidth - 2;
  const bottom = y + cellHeight - 2;

  switch (char) {
    case '─':
      fillRect(rgba, width, height, x + 1, midY, cellWidth - 2, 1, color);
      return true;
    case '│':
      fillRect(rgba, width, height, midX, y + 1, 1, cellHeight - 2, color);
      return true;
    case '┌':
      fillRect(rgba, width, height, midX, midY, right - midX + 1, 1, color);
      fillRect(rgba, width, height, midX, midY, 1, bottom - midY + 1, color);
      return true;
    case '┐':
      fillRect(rgba, width, height, x + 1, midY, midX - x, 1, color);
      fillRect(rgba, width, height, midX, midY, 1, bottom - midY + 1, color);
      return true;
    case '└':
      fillRect(rgba, width, height, midX, y + 1, 1, midY - y, color);
      fillRect(rgba, width, height, midX, midY, right - midX + 1, 1, color);
      return true;
    case '┘':
      fillRect(rgba, width, height, x + 1, midY, midX - x, 1, color);
      fillRect(rgba, width, height, midX, y + 1, 1, midY - y, color);
      return true;
    case '▎':
      fillRect(rgba, width, height, x + 1, y + 1, 1, cellHeight - 2, color);
      return true;
    default:
      return false;
  }
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

function setPixel(rgba: Uint8Array, width: number, height: number, x: number, y: number, color: Rgb): void {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const idx = (y * width + x) * 4;
  rgba[idx] = color.r;
  rgba[idx + 1] = color.g;
  rgba[idx + 2] = color.b;
  rgba[idx + 3] = 255;
}

function joinFrames(frames: Uint8Array[]): Uint8Array {
  const total = frames.reduce((sum, frame) => sum + frame.length, 0);
  const joined = new Uint8Array(total);
  let offset = 0;
  for (const frame of frames) {
    joined.set(frame, offset);
    offset += frame.length;
  }
  return joined;
}

function normalizeSurfaceFrame(surface: Surface, width: number, height: number): Surface {
  if (surface.width === width && surface.height === height) {
    return surface;
  }

  const normalized = createSurface(width, height);
  normalized.blit(surface, 0, 0);
  return normalized;
}

interface Rgb {
  r: number;
  g: number;
  b: number;
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
