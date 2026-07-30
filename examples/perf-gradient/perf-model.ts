import type { MemStats } from './perf-memory.js';

export const CAPPED_MS = Math.round(1000 / 60);
export const UNCAPPED_MS = 1;
export const GRAPH_SAMPLES = 60;
export const MODE_NAMES = ['gradient', 'horizon', 'noise', 'quad'] as const;
export const MODE_COUNT = MODE_NAMES.length;
export const phaseTiming = { updateMs: 0, viewMs: 0 };

export interface Model {
  frame: number;
  elapsed: number;
  fps: number;
  fpsAccum: number;
  fpsSamples: number;
  cols: number;
  rows: number;
  mouseDown: boolean;
  mode: number;
  capped: boolean;
  tickGen: number;
  lastTickMs: number;
  frameTimeMs: number;
  mem: MemStats;
  memSampleFrame: number;
}

export interface Msg {
  type: 'tick';
  gen: number;
}

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

function hexByte(value: number): string {
  const hex = clamp(Math.round(value), 0, 255).toString(16);
  return hex.length === 1 ? `0${hex}` : hex;
}

export function rgbHex(red: number, green: number, blue: number): string {
  return `#${hexByte(red)}${hexByte(green)}${hexByte(blue)}`;
}
