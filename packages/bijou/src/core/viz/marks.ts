import { colorRgb } from '../theme/color.js';
import type { RGB, TokenValue } from '../theme/tokens.js';
import type { OklchScale } from './scales.js';

export interface PlotPoint {
  readonly x: number;
  readonly y: number;
  readonly colorValue?: number;
}

export type MarkColorInput = string | TokenValue | RGB;

export interface MarkBaseOptions {
  readonly label?: string;
  readonly stroke?: MarkColorInput;
}

export interface AccessorOptions<T> extends MarkBaseOptions {
  readonly x?: (datum: T, index: number) => number;
  readonly y?: (datum: T, index: number) => number;
}

export interface AreaMarkOptions<T> extends AccessorOptions<T> {
  readonly y0?: number;
}

export interface DotMarkOptions<T> extends AccessorOptions<T> {
  readonly colorValue?: (datum: T, index: number) => number;
  readonly colorScale?: OklchScale;
}

export interface LineYMark {
  readonly kind: 'lineY';
  readonly points: readonly PlotPoint[];
  readonly label?: string;
  readonly stroke?: MarkColorInput;
}

export interface AreaYMark {
  readonly kind: 'areaY';
  readonly points: readonly PlotPoint[];
  readonly y0: number;
  readonly label?: string;
  readonly stroke?: MarkColorInput;
}

export interface DotMark {
  readonly kind: 'dot';
  readonly points: readonly PlotPoint[];
  readonly label?: string;
  readonly stroke?: MarkColorInput;
  readonly colorScale?: OklchScale;
}

export interface BarYMark {
  readonly kind: 'barY';
  readonly points: readonly PlotPoint[];
  readonly label?: string;
  readonly stroke?: MarkColorInput;
}

export interface RuleYMark {
  readonly kind: 'ruleY';
  readonly y: number;
  readonly label?: string;
  readonly stroke?: MarkColorInput;
}

export interface RuleXMark {
  readonly kind: 'ruleX';
  readonly x: number;
  readonly label?: string;
  readonly stroke?: MarkColorInput;
}

export type PlotMark = LineYMark | AreaYMark | DotMark | BarYMark | RuleYMark | RuleXMark;

const DEFAULT_SERIES_PALETTE: readonly RGB[] = [
  [56, 189, 248], [244, 114, 182], [52, 211, 153], [251, 191, 36], [167, 139, 250],
];

export function resolveMarkRGB(input: MarkColorInput | undefined, seriesIndex = 0): RGB {
  const fallback: RGB = DEFAULT_SERIES_PALETTE[seriesIndex % DEFAULT_SERIES_PALETTE.length] ?? [56, 189, 248];
  if (Array.isArray(input)) {
    return [input[0], input[1], input[2]];
  }
  if (typeof input === 'string') return colorRgb(input) ?? fallback;
  if (input && typeof input === 'object' && 'hex' in input) {
    return input.fgRGB ?? colorRgb(input.hex) ?? fallback;
  }
  return fallback;
}

function safeNum(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

export function normalizePoints<T>(data: readonly T[], options?: DotMarkOptions<T>): PlotPoint[] {
  const out: PlotPoint[] = [];
  for (const [i, d] of data.entries()) {
    if (typeof d === 'number') {
      out.push({ x: i, y: safeNum(d) });
    } else if (options?.x || options?.y) {
      const x = safeNum(options.x ? options.x(d, i) : i, i);
      const y = safeNum(options.y ? options.y(d, i) : 0, 0);
      const cv = options.colorValue ? safeNum(options.colorValue(d, i)) : undefined;
      out.push(cv !== undefined ? { x, y, colorValue: cv } : { x, y });
    } else if (typeof d === 'object' && d !== null && 'x' in d && 'y' in d) {
      const rec = d as { readonly x: unknown; readonly y: unknown; readonly colorValue?: unknown };
      const cv = typeof rec.colorValue === 'number' ? safeNum(rec.colorValue) : undefined;
      out.push(cv !== undefined ? { x: safeNum(rec.x, i), y: safeNum(rec.y, 0), colorValue: cv } : { x: safeNum(rec.x, i), y: safeNum(rec.y, 0) });
    } else {
      out.push({ x: i, y: 0 });
    }
  }
  return out;
}

export function lineY<T = number>(data: readonly T[], options?: AccessorOptions<T>): LineYMark {
  return { kind: 'lineY', points: normalizePoints(data, options), label: options?.label, stroke: options?.stroke };
}

export function areaY<T = number>(data: readonly T[], options?: AreaMarkOptions<T>): AreaYMark {
  return { kind: 'areaY', points: normalizePoints(data, options), y0: safeNum(options?.y0, 0), label: options?.label, stroke: options?.stroke };
}

export function dot<T = number>(data: readonly T[], options?: DotMarkOptions<T>): DotMark {
  return { kind: 'dot', points: normalizePoints(data, options), label: options?.label, stroke: options?.stroke, colorScale: options?.colorScale };
}

export function barY<T = number>(data: readonly T[], options?: AccessorOptions<T>): BarYMark {
  return { kind: 'barY', points: normalizePoints(data, options), label: options?.label, stroke: options?.stroke };
}

export function ruleY(y: number, options?: MarkBaseOptions): RuleYMark {
  return { kind: 'ruleY', y: safeNum(y, 0), label: options?.label, stroke: options?.stroke };
}

export function ruleX(x: number, options?: MarkBaseOptions): RuleXMark {
  return { kind: 'ruleX', x: safeNum(x, 0), label: options?.label, stroke: options?.stroke };
}
