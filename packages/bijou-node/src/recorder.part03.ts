import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { sanitizePositiveInt, type Surface } from '@flyingrobots/bijou';
import { applyGifPalette, createGifEncoder, quantizeColors } from './gifenc-runtime.js';
import { DEFAULT_BACKGROUND, DEFAULT_FOREGROUND, fillRect, mixRgb, normalizeRgb, normalizeSurfaceFrame, parseHex, resolvedColorHex, resolvedColorRgb } from './recorder.part01.js';
import type { RasterizeOptions, RecorderResult, SurfaceGifOptions } from './recorder.part01.js';
import { drawBitmapGlyph, drawSpecialGlyph } from './recorder.part02.js';

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
  const palette = quantizeColors(joinFrames(frames), 256, { format: 'rgb565' });
  const gif = createGifEncoder();
  const delay = Math.max(2, Math.round(sanitizePositiveInt(options.frameDelayMs, 90) / 10));

  for (const frame of frames) {
    const indexed = applyGifPalette(frame, palette);
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
