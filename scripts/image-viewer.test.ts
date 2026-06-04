import { deflateSync } from 'node:zlib';
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import type { Surface } from '@flyingrobots/bijou';
import { createImageViewerApp } from '../examples/image-viewer/main.js';
import { decodeImageRgba, decodePngRgba, decodePpmRgba } from '../examples/image-viewer/image-codecs.js';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'bijou-image-viewer-'));
  tempDirs.push(dir);
  return dir;
}

function frameText(frame: Surface): string {
  let text = '';
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      text += frame.get(x, y).char || ' ';
    }
    text += '\n';
  }
  return text;
}

function keyMsg(key: string) {
  return {
    type: 'key' as const,
    key,
    ctrl: false,
    alt: false,
    shift: false,
  };
}

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

  it('decodes P3 PPM samples including zero values', () => {
    const frame = decodePpmRgba(Buffer.from('P3\n# sample image\n2 1\n255\n255 0 0 0 0 255\n'));

    expect(frame.width).toBe(2);
    expect(frame.height).toBe(1);
    expect(Array.from(frame.data)).toEqual([
      255, 0, 0, 255,
      0, 0, 255, 255,
    ]);
  });

  it('rejects P3 PPM samples above the declared max value', () => {
    expect(() => decodePpmRgba(Buffer.from('P3\n1 1\n127\n128 0 0\n')))
      .toThrow('PPM decoder expected red to be between 0 and 127.');
  });

  it('decodes P6 PPM binary data without consuming pixel bytes as whitespace', () => {
    const frame = decodePpmRgba(Buffer.concat([
      Buffer.from('P6\n1 1\n255\n'),
      Buffer.from([0, 10, 32]),
    ]));

    expect(Array.from(frame.data)).toEqual([0, 10, 32, 255]);
  });

  it('rejects P6 PPM samples above the declared max value', () => {
    expect(() => decodePpmRgba(Buffer.concat([
      Buffer.from('P6\n1 1\n127\n'),
      Buffer.from([128, 0, 0]),
    ]))).toThrow('PPM decoder expected red to be between 0 and 127.');
  });

  it('routes PNG and PPM data through the image decoder facade', () => {
    const png = decodeImageRgba(makePng({
      width: 1,
      height: 1,
      colorType: 2,
      rows: [[1, 2, 3]],
    }));
    const ppm = decodeImageRgba(Buffer.from('P3\n1 1\n255\n4 5 6\n'), 'sample.ppm');

    expect(png.format).toBe('png');
    expect(Array.from(png.frame.data)).toEqual([1, 2, 3, 255]);
    expect(ppm.format).toBe('ppm');
    expect(Array.from(ppm.frame.data)).toEqual([4, 5, 6, 255]);
  });
});

describe('image viewer app', () => {
  it('starts with the first supported image selected from the root', () => {
    const root = createTempDir();
    writeFileSync(join(root, 'notes.txt'), 'ignored');
    writeFileSync(join(root, 'sample.ppm'), 'P3\n1 1\n255\n255 255 255\n');
    const ctx = createTestContext({ runtime: { columns: 96, rows: 28 } });
    const app = createImageViewerApp(ctx, { root });
    const [model] = app.init();

    expect(model.selectedPath).toBe(realpathSync.native(join(root, 'sample.ppm')));
    const text = frameText(app.view(model) as Surface);
    expect(text).toContain('Images');
    expect(text).toContain('sample.ppm');
    expect(text).toContain('Mode: braille');
    expect(text).toContain('Format: PPM');
  });

  it('hot-swaps the selected image renderer from Braille to ASCII', () => {
    const root = createTempDir();
    writeFileSync(join(root, 'sample.ppm'), 'P3\n2 1\n255\n255 255 255 0 0 0\n');
    const ctx = createTestContext({ runtime: { columns: 96, rows: 28 } });
    const app = createImageViewerApp(ctx, { root });
    const [model] = app.init();
    const [next] = app.update(keyMsg('m'), model);

    expect(next.mode).toBe('ascii');
    expect(frameText(app.view(next) as Surface)).toContain('Mode: ascii');
  });

  it('selects the focused image file through the file picker key map', () => {
    const root = createTempDir();
    writeFileSync(join(root, 'a.ppm'), 'P3\n1 1\n255\n255 0 0\n');
    writeFileSync(join(root, 'b.ppm'), 'P3\n1 1\n255\n0 0 255\n');
    const ctx = createTestContext({ runtime: { columns: 96, rows: 28 } });
    const app = createImageViewerApp(ctx, { root });
    const [model] = app.init();
    const [focused] = app.update(keyMsg('down'), model);
    const [selected] = app.update(keyMsg('enter'), focused);

    expect(selected.selectedPath).toBe(realpathSync.native(join(root, 'b.ppm')));
    const text = frameText(app.view(selected) as Surface);
    expect(text).toContain('b.ppm');
    expect(text).toContain('Format: PPM');
  });
});
