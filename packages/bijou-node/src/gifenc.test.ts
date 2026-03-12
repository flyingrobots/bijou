import { describe, expectTypeOf, it } from 'vitest';
import type {
  GifByteStream,
  GifEncoderOptions,
  GifEncoderStream,
  GifFrameOptions,
  PaletteColor,
  PaletteFormat,
  QuantizeOptions,
} from 'gifenc';

describe('gifenc ambient types', () => {
  it('describe the encoder and palette helper surface', () => {
    expectTypeOf<PaletteFormat>().toEqualTypeOf<'rgb565' | 'rgb444' | 'rgba4444'>();
    expectTypeOf<PaletteColor>().toEqualTypeOf<[number, number, number] | [number, number, number, number]>();
    expectTypeOf<GifEncoderOptions>().toMatchTypeOf<{
      auto?: boolean;
      initialCapacity?: number;
    }>();
    expectTypeOf<QuantizeOptions>().toMatchTypeOf<{
      format?: PaletteFormat;
      clearAlpha?: boolean;
      clearAlphaColor?: number;
      clearAlphaThreshold?: number;
      oneBitAlpha?: boolean | number;
      useSqrt?: boolean;
    }>();
    expectTypeOf<GifFrameOptions>().toMatchTypeOf<{
      palette?: PaletteColor[];
      first?: boolean;
      transparent?: boolean;
      transparentIndex?: number;
      delay?: number;
      repeat?: number;
      dispose?: number;
      colorDepth?: number;
    }>();
    expectTypeOf<GifByteStream['writeByte']>().toBeFunction();
    expectTypeOf<GifByteStream['writeBytes']>().toBeFunction();
    expectTypeOf<GifByteStream['writeBytesView']>().toBeFunction();
    expectTypeOf<GifEncoderStream['bytesView']>().toBeFunction();
    expectTypeOf<GifEncoderStream['writeHeader']>().toBeFunction();
    expectTypeOf<GifEncoderStream['reset']>().toBeFunction();
    expectTypeOf<GifEncoderStream['buffer']>().toEqualTypeOf<ArrayBufferLike>();
    expectTypeOf<GifEncoderStream['stream']>().toEqualTypeOf<GifByteStream>();
  });
});
