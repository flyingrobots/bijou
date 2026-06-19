import * as gifencModule from 'gifenc';
import type {
  GifEncoderOptions,
  GifEncoderStream,
  PaletteColor,
  PaletteFormat,
  QuantizeOptions,
} from 'gifenc';

interface GifencRuntime {
  readonly GIFEncoder: (options?: GifEncoderOptions) => GifEncoderStream;
  readonly applyPalette: (
    rgba: Uint8Array | Uint8ClampedArray,
    palette: PaletteColor[],
    format?: PaletteFormat,
  ) => Uint8Array;
  readonly quantize: (
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: QuantizeOptions,
  ) => PaletteColor[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isGifencRuntime(value: unknown): value is GifencRuntime {
  return (
    isRecord(value)
    && typeof value['GIFEncoder'] === 'function'
    && typeof value['applyPalette'] === 'function'
    && typeof value['quantize'] === 'function'
  );
}

function resolveGifencRuntime(value: unknown): GifencRuntime {
  if (isGifencRuntime(value)) {
    return value;
  }
  if (isRecord(value) && isGifencRuntime(value['default'])) {
    return value['default'];
  }
  throw new Error('Invalid gifenc module shape');
}

const GIFENC = resolveGifencRuntime(gifencModule);

export function createGifEncoder(options?: GifEncoderOptions): GifEncoderStream {
  return GIFENC.GIFEncoder(options);
}

export function applyGifPalette(
  rgba: Uint8Array | Uint8ClampedArray,
  palette: PaletteColor[],
  format?: PaletteFormat,
): Uint8Array {
  return GIFENC.applyPalette(rgba, palette, format);
}

export function quantizeColors(
  rgba: Uint8Array | Uint8ClampedArray,
  maxColors: number,
  options?: QuantizeOptions,
): PaletteColor[] {
  return GIFENC.quantize(rgba, maxColors, options);
}
