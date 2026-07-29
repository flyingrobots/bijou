import type { Cell } from '@flyingrobots/bijou';
import { parseHex } from '@flyingrobots/bijou/perf';
import type { CellGlyphFitOptions } from './cell-glyph-fit.js';

type RGB = readonly [number, number, number];

interface ColorAccumulator {
  r: number;
  g: number;
  b: number;
  count: number;
}

interface StyleAccumulator {
  fg: ColorAccumulator;
  bg: ColorAccumulator;
}

function isResolvedColorRecord(ref: unknown): ref is Record<string, unknown> {
  return typeof ref === 'object'
    && ref !== null
    && 'kind' in ref
    && ref.kind === 'resolved-color';
}

function isRgbTuple(value: unknown): value is readonly [number, number, number] {
  return Array.isArray(value)
    && value.length === 3
    && value.every((channel) => typeof channel === 'number');
}

function resolvedColorRgb(ref: unknown): readonly [number, number, number] | undefined {
  const rgb = isResolvedColorRecord(ref) ? ref['rgb'] : undefined;
  return isRgbTuple(rgb)
    ? rgb
    : undefined;
}

function resolvedColorHex(ref: unknown): string | undefined {
  if (typeof ref === 'string') return ref;
  const hex = isResolvedColorRecord(ref) ? ref['hex'] : undefined;
  return typeof hex === 'string'
    ? hex
    : undefined;
}

function resolveCellColor(rgb: RGB | undefined, ref: Cell['fg']  ): RGB | undefined {
  if (rgb !== undefined) return rgb;

  const resolvedRgb = resolvedColorRgb(ref);
  if (resolvedRgb !== undefined) return resolvedRgb;

  const hex = resolvedColorHex(ref);
  return hex === undefined ? undefined : parseHex(hex);
}

function createColorAccumulator(): ColorAccumulator {
  return { r: 0, g: 0, b: 0, count: 0 };
}

function createStyleAccumulator(): StyleAccumulator {
  return {
    fg: createColorAccumulator(),
    bg: createColorAccumulator()
  };
}

function accumulateColor(accumulator: ColorAccumulator, rgb: RGB): void {
  accumulator.r += rgb[0];
  accumulator.g += rgb[1];
  accumulator.b += rgb[2];
  accumulator.count++;
}

function accumulateResolvedColor(accumulator: ColorAccumulator, rgb: RGB | undefined, ref: Cell['fg']  ): void {
  const resolved = resolveCellColor(rgb, ref);
  if (resolved !== undefined) accumulateColor(accumulator, resolved);
}

function accumulateCellStyle(accumulator: StyleAccumulator, cell: Cell): void {
  accumulateResolvedColor(accumulator.fg, cell.fgRGB, cell.fg);
  accumulateResolvedColor(accumulator.bg, cell.bgRGB, cell.bg);
}

function averagedColor(accumulator: ColorAccumulator): RGB | undefined {
  if (accumulator.count === 0) return undefined;
  return [
    Math.round(accumulator.r / accumulator.count),
    Math.round(accumulator.g / accumulator.count),
    Math.round(accumulator.b / accumulator.count)
  ];
}

function averagedCellStyle(accumulator: StyleAccumulator): Pick<Cell, 'fgRGB' | 'bgRGB'> {
  const style: Pick<Cell, 'fgRGB' | 'bgRGB'> = {};
  const fgRGB = averagedColor(accumulator.fg);
  const bgRGB = averagedColor(accumulator.bg);
  if (fgRGB !== undefined) style.fgRGB = fgRGB;
  if (bgRGB !== undefined) style.bgRGB = bgRGB;
  return style;
}

export interface ShaderParams {
  /** Normalized horizontal coordinate (0.0 to 1.0). */
  u: number;
  /** Normalized vertical coordinate (0.0 to 1.0). */
  v: number;
  /** Animation time value in seconds. */
  time: number;
  /** Custom data bag passed to the shader. */
  uniforms: Record<string, unknown>;
}

export interface ShaderCell extends Cell {
  /** Optional normalized coverage used by glyph-fit resolution. */
  readonly coverage?: number;
}

export type ShaderFn = (params: ShaderParams) => ShaderCell | string;

export type CanvasResolution = 'cell' | 'quad' | 'braille' | 'glyph';

export interface CanvasOptions {
  /** Animation time value passed to the shader. Default: 0. */
  time?: number;
  /** Plotting resolution. Default: 'cell'. */
  resolution?: CanvasResolution;
  /** Custom data passed to the shader. */
  uniforms?: Record<string, unknown>;
  /** Glyph fitting options used when resolution is 'glyph'. */
  glyphFit?: CellGlyphFitOptions;
}

export { accumulateCellStyle, averagedCellStyle, createStyleAccumulator, resolveCellColor };
