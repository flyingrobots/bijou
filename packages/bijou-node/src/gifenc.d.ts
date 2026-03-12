declare module 'gifenc' {
  export type PaletteFormat = 'rgb565' | 'rgb444' | 'rgba4444';
  export type PaletteColor = [number, number, number] | [number, number, number, number];

  export interface GifEncoderOptions {
    auto?: boolean;
    initialCapacity?: number;
  }

  export interface QuantizeOptions {
    format?: PaletteFormat;
    clearAlpha?: boolean;
    clearAlphaColor?: number;
    clearAlphaThreshold?: number;
    oneBitAlpha?: boolean | number;
    useSqrt?: boolean;
  }

  export interface GifFrameOptions {
    palette?: PaletteColor[];
    first?: boolean;
    transparent?: boolean;
    transparentIndex?: number;
    delay?: number;
    repeat?: number;
    dispose?: number;
    colorDepth?: number;
  }

  export interface GifByteStream {
    readonly buffer: ArrayBufferLike;
    reset(): void;
    bytes(): Uint8Array;
    bytesView(): Uint8Array;
    writeByte(byte: number): void;
    writeBytes(data: ArrayLike<number>, offset?: number, byteLength?: number): void;
    writeBytesView(data: Uint8Array, offset?: number, byteLength?: number): void;
  }

  export interface GifEncoderStream {
    readonly buffer: ArrayBufferLike;
    readonly stream: GifByteStream;
    writeFrame(index: Uint8Array, width: number, height: number, options: GifFrameOptions): void;
    writeHeader(): void;
    finish(): void;
    reset(): void;
    bytes(): Uint8Array;
    bytesView(): Uint8Array;
  }

  export function GIFEncoder(options?: GifEncoderOptions): GifEncoderStream;
  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: QuantizeOptions,
  ): PaletteColor[];
  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: PaletteColor[],
    format?: PaletteFormat,
  ): Uint8Array;
  export function nearestColorIndex(
    colors: PaletteColor[],
    pixel: PaletteColor,
    distanceFn?: (pixel: PaletteColor, paletteColor: PaletteColor) => number,
  ): number;
  export function nearestColorIndexWithDistance(
    colors: PaletteColor[],
    pixel: PaletteColor,
    distanceFn?: (pixel: PaletteColor, paletteColor: PaletteColor) => number,
  ): [number, number];
}
