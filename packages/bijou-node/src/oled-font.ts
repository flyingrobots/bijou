import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export interface OledFont {
  readonly width: number;
  readonly height: number;
  readonly fontData: readonly number[];
  readonly lookup: readonly string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNumberArray(value: unknown): value is readonly number[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'number');
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function loadOledFont(): OledFont {
  const loaded: unknown = require('oled-font-5x7');
  if (
    !isRecord(loaded)
    || typeof loaded['width'] !== 'number'
    || typeof loaded['height'] !== 'number'
    || !isNumberArray(loaded['fontData'])
    || !isStringArray(loaded['lookup'])
  ) {
    throw new Error('Invalid oled-font-5x7 module shape');
  }
  return {
    width: loaded['width'],
    height: loaded['height'],
    fontData: loaded['fontData'],
    lookup: loaded['lookup'],
  };
}
