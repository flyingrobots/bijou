import { deflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { decodePngRgba } from '../examples/docs/png-rgba.js';

describe('decodePngRgba()', () => {
  it('decodes a tiny RGB PNG into RGBA pixels', () => {
    const image = decodePngRgba(makePng({
      width: 2,
      height: 1,
      colorType: 2,
      bytesPerPixel: 3,
      scanlines: [
        [0, 255, 0, 0, 0, 0, 255],
      ],
    }));

    expect(image.width).toBe(2);
    expect(image.height).toBe(1);
    expect(Array.from(image.data)).toEqual([
      255, 0, 0, 255,
      0, 0, 255, 255,
    ]);
  });

  it('applies PNG sub and up filters before RGBA conversion', () => {
    const image = decodePngRgba(makePng({
      width: 2,
      height: 2,
      colorType: 6,
      bytesPerPixel: 4,
      scanlines: [
        [0, 10, 20, 30, 40, 20, 30, 40, 50],
        [2, 5, 5, 5, 5, 5, 5, 5, 5],
      ],
    }));

    expect(Array.from(image.data)).toEqual([
      10, 20, 30, 40,
      20, 30, 40, 50,
      15, 25, 35, 45,
      25, 35, 45, 55,
    ]);
  });

  it('rejects unsupported indexed-color PNGs', () => {
    expect(() => decodePngRgba(makePng({
      width: 1,
      height: 1,
      colorType: 3,
      bytesPerPixel: 1,
      scanlines: [[0, 0]],
    }))).toThrow(/RGB and RGBA/);
  });
});

function makePng(input: {
  readonly width: number;
  readonly height: number;
  readonly colorType: number;
  readonly bytesPerPixel: number;
  readonly scanlines: readonly (readonly number[])[];
}): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(input.width, 0);
  header.writeUInt32BE(input.height, 4);
  header[8] = 8;
  header[9] = input.colorType;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(Buffer.from(input.scanlines.flat()))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function chunk(type: string, data: Buffer): Buffer {
  const output = Buffer.alloc(12 + data.length);
  output.writeUInt32BE(data.length, 0);
  output.write(type, 4, 4, 'ascii');
  data.copy(output, 8);
  return output;
}
