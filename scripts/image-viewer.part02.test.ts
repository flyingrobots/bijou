
import { rmSync } from 'node:fs';

import { afterEach, describe, expect, it } from 'vitest';

import { decodePpmRgba } from '../examples/image-viewer/image-codecs.js';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('image viewer codecs', () => {
it('decodes P3 PPM samples including zero values', () => {
    const frame = decodePpmRgba(Buffer.from('P3\n# sample image\n2 1\n255\n255 0 0 0 0 255\n'));

    expect(frame.width).toBe(2);
    expect(frame.height).toBe(1);
    expect(Array.from(frame.data)).toEqual([
      255, 0, 0, 255,
      0, 0, 255, 255,
    ]);
  });
});

describe('image viewer codecs', () => {
it('rejects P3 PPM samples above the declared max value', () => {
    expect(() => decodePpmRgba(Buffer.from('P3\n1 1\n127\n128 0 0\n')))
      .toThrow('PPM decoder expected red to be between 0 and 127.');
  });
});

describe('image viewer codecs', () => {
it('decodes P6 PPM binary data without consuming pixel bytes as whitespace', () => {
    const frame = decodePpmRgba(Buffer.concat([
      Buffer.from('P6\n1 1\n255\n'),
      Buffer.from([0, 10, 32]),
    ]));

    expect(Array.from(frame.data)).toEqual([0, 10, 32, 255]);
  });
});

describe('image viewer codecs', () => {
it('rejects P6 PPM samples above the declared max value', () => {
    expect(() => decodePpmRgba(Buffer.concat([
      Buffer.from('P6\n1 1\n127\n'),
      Buffer.from([128, 0, 0]),
    ]))).toThrow('PPM decoder expected red to be between 0 and 127.');
  });
});
