import { deflateSync } from 'node:zlib';
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';

import { join } from 'node:path';

import { tmpdir } from 'node:os';

import { afterEach, describe, expect, it } from 'vitest';

import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { type Surface } from '@flyingrobots/bijou';

import { createImageViewerApp } from '../examples/image-viewer/main.js';
import { decodeImageRgba } from '../examples/image-viewer/image-codecs.js';

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
    expect(model.picker.focusIndex).toBe(0);
    const text = frameText(app.view(model));
    expect(text).toContain('Images');
    expect(text).toContain('> * - sample.ppm');
    expect(text).toContain('Mode: braille');
    expect(text).toContain('Zoom: 100%');
    expect(text).toContain('Pan: 0,0');
    expect(text).toContain('Format: PPM');
  });
});
