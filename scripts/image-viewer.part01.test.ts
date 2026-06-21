import { deflateSync } from 'node:zlib';
import { rmSync } from 'node:fs';

import { afterEach, describe, expect, it } from 'vitest';

import { decodePngRgba } from '../examples/image-viewer/image-codecs.js';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function pngChunk(type: string, data = Buffer.alloc(0)): Buffer {
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  return chunk;
}

function makePng(options: {
  readonly width: number;
  readonly height: number;
  readonly colorType: 2 | 6;
  readonly rows: readonly number[][];
}): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(options.width, 0);
  header.writeUInt32BE(options.height, 4);
  header[8] = 8;
  header[9] = options.colorType;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const scanlines: number[] = [];
  for (const row of options.rows) {
    scanlines.push(0, ...row);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(Buffer.from(scanlines))),
    pngChunk('IEND'),
  ]);
}

describe('image viewer codecs', () => {
  it('decodes 8-bit RGB PNG pixels into RGBA', () => {
    const frame = decodePngRgba(makePng({
      width: 2,
      height: 1,
      colorType: 2,
      rows: [[255, 0, 0, 0, 128, 255]],
    }));

    expect(frame.width).toBe(2);
    expect(frame.height).toBe(1);
    expect(Array.from(frame.data)).toEqual([
      255, 0, 0, 255,
      0, 128, 255, 255,
    ]);
  });
});

describe('image viewer codecs', () => {
  it('decodes 8-bit RGBA PNG pixels without replacing alpha', () => {
    const frame = decodePngRgba(makePng({
      width: 1,
      height: 2,
      colorType: 6,
      rows: [
        [10, 20, 30, 40],
        [50, 60, 70, 80],
      ],
    }));

    expect(Array.from(frame.data)).toEqual([
      10, 20, 30, 40,
      50, 60, 70, 80,
    ]);
  });
});
