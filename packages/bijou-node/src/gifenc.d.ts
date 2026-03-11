declare module 'gifenc' {
  export interface GifFrameOptions {
    palette: number[][];
    delay?: number;
  }

  export interface GifEncoderStream {
    writeFrame(index: Uint8Array, width: number, height: number, options: GifFrameOptions): void;
    finish(): void;
    bytes(): Uint8Array;
  }

  export function GIFEncoder(): GifEncoderStream;
  export function quantize(rgba: Uint8Array, maxColors: number, options?: Record<string, unknown>): number[][];
  export function applyPalette(rgba: Uint8Array, palette: number[][]): Uint8Array;
}
