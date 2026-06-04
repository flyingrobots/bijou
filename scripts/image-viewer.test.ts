import { deflateSync } from 'node:zlib';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { colorHex, type Surface } from '@flyingrobots/bijou';
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

function brailleGlyphCells(frame: Surface): Array<ReturnType<Surface['get']>> {
  const cells: Array<ReturnType<Surface['get']>> = [];
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      const cell = frame.get(x, y);
      const codePoint = cell.char?.codePointAt(0);
      if (codePoint !== undefined && codePoint > 0x2800 && codePoint <= 0x28ff) {
        cells.push(cell);
      }
    }
  }
  return cells;
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
    expect(model.picker.focusIndex).toBe(0);
    const text = frameText(app.view(model) as Surface);
    expect(text).toContain('Images');
    expect(text).toContain('> * - sample.ppm');
    expect(text).toContain('Mode: braille');
    expect(text).toContain('Zoom: 100%');
    expect(text).toContain('Pan: 0,0');
    expect(text).toContain('Format: PPM');
  });

  it('focuses the selected image when directories sort before files', () => {
    const root = createTempDir();
    mkdirSync(join(root, 'child'));
    writeFileSync(join(root, 'sample.ppm'), 'P3\n1 1\n255\n0 0 0\n');
    const ctx = createTestContext({ runtime: { columns: 96, rows: 28 } });
    const app = createImageViewerApp(ctx, { root });
    const [model] = app.init();

    expect(model.picker.entries[0]).toEqual({ name: 'child', isDirectory: true });
    expect(model.picker.entries[1]).toEqual({ name: 'sample.ppm', isDirectory: false });
    expect(model.picker.focusIndex).toBe(1);
    expect(frameText(app.view(model) as Surface)).toContain('> * - sample.ppm');
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

  it('can preserve sampled image colors on rendered glyphs', () => {
    const root = createTempDir();
    writeFileSync(join(root, 'sample.ppm'), 'P3\n1 1\n255\n255 0 0\n');
    const ctx = createTestContext({ runtime: { columns: 180, rows: 28 } });
    const app = createImageViewerApp(ctx, { root });
    const [model] = app.init();
    const [colored] = app.update(keyMsg('c'), model);
    const glyphCells = brailleGlyphCells(app.view(colored) as Surface);
    const text = frameText(app.view(colored) as Surface);

    expect(colored.tuning.colorMode).toBe('fg');
    expect(glyphCells.some((cell) => {
      const rgb = cell.fgRGB;
      return rgb !== undefined && rgb[0] === 255 && rgb[1] === 0 && rgb[2] === 0;
    }))
      .toBe(true);
    expect(text).toContain('Color: foreground');
  });

  it('adjusts threshold, contrast, and ordered dithering from preview keys', () => {
    const root = createTempDir();
    writeFileSync(join(root, 'sample.ppm'), 'P3\n1 1\n255\n128 128 128\n');
    const ctx = createTestContext({ runtime: { columns: 220, rows: 28 } });
    const app = createImageViewerApp(ctx, { root });
    const [model] = app.init();
    const [thresholdUp] = app.update(keyMsg(']'), model);
    const [contrastUp] = app.update(keyMsg('.'), thresholdUp);
    const [dithered] = app.update(keyMsg('d'), contrastUp);
    const text = frameText(app.view(dithered) as Surface);

    expect(dithered.tuning).toEqual({
      colorMode: 'none',
      thresholdPercent: 50,
      contrastPercent: 110,
      dither: 'ordered',
    });
    expect(text).toContain('Dither: ordered');
    expect(text).toContain('Threshold: 50%');
    expect(text).toContain('Contrast: 110%');
  });

  it('selects the focused image file through the file picker key map', () => {
    const root = createTempDir();
    writeFileSync(join(root, 'a.ppm'), 'P3\n1 1\n255\n255 0 0\n');
    writeFileSync(join(root, 'b.ppm'), 'P3\n1 1\n255\n0 0 255\n');
    const ctx = createTestContext({ runtime: { columns: 96, rows: 28 } });
    const app = createImageViewerApp(ctx, { root });
    const [model] = app.init();
    const [focused] = app.update(keyMsg('j'), model);
    const [selected] = app.update(keyMsg('enter'), focused);

    expect(selected.selectedPath).toBe(realpathSync.native(join(root, 'b.ppm')));
    const text = frameText(app.view(selected) as Surface);
    expect(text).toContain('b.ppm');
    expect(text).toContain('Format: PPM');
  });

  it('keeps selected and focused image rows visually distinct', () => {
    const root = createTempDir();
    writeFileSync(join(root, 'a.ppm'), 'P3\n1 1\n255\n255 0 0\n');
    writeFileSync(join(root, 'b.ppm'), 'P3\n1 1\n255\n0 0 255\n');
    const ctx = createTestContext({ runtime: { columns: 96, rows: 28 } });
    const app = createImageViewerApp(ctx, { root });
    const [model] = app.init();
    const [focused] = app.update(keyMsg('j'), model);
    const text = frameText(app.view(focused) as Surface);

    expect(text).toContain('  * - a.ppm');
    expect(text).toContain('>   - b.ppm');
  });

  it('uses arrow keys to pan the image viewport without moving file focus', () => {
    const root = createTempDir();
    writeFileSync(join(root, 'a.ppm'), 'P3\n2 1\n255\n255 0 0 0 0 255\n');
    writeFileSync(join(root, 'b.ppm'), 'P3\n2 1\n255\n0 0 255 255 0 0\n');
    const ctx = createTestContext({ runtime: { columns: 96, rows: 28 } });
    const app = createImageViewerApp(ctx, { root });
    const [model] = app.init();
    const [pannedRight] = app.update(keyMsg('right'), model);
    const [pannedDown] = app.update(keyMsg('down'), pannedRight);

    expect(pannedDown.picker.focusIndex).toBe(model.picker.focusIndex);
    expect(pannedDown.viewport).toEqual({
      zoomPercent: 100,
      panX: 4,
      panY: 2,
    });
    const text = frameText(app.view(pannedDown) as Surface);
    expect(text).toContain('Pan: +4,+2');
  });

  it('zooms the image viewport and resets to fit', () => {
    const root = createTempDir();
    writeFileSync(join(root, 'sample.ppm'), 'P3\n2 1\n255\n255 0 0 0 0 255\n');
    const ctx = createTestContext({ runtime: { columns: 96, rows: 28 } });
    const app = createImageViewerApp(ctx, { root });
    const [model] = app.init();
    const [zoomedIn] = app.update(keyMsg('+'), model);
    const [zoomedOut] = app.update(keyMsg('-'), zoomedIn);
    const [zoomedOutAgain] = app.update(keyMsg('-'), zoomedOut);
    const [reset] = app.update(keyMsg('0'), zoomedOutAgain);

    expect(zoomedIn.viewport.zoomPercent).toBe(125);
    expect(zoomedOut.viewport.zoomPercent).toBe(100);
    expect(zoomedOutAgain.viewport.zoomPercent).toBe(80);
    expect(reset.viewport).toEqual({
      zoomPercent: 100,
      panX: 0,
      panY: 0,
    });
    expect(frameText(app.view(zoomedIn) as Surface)).toContain('Zoom: 125%');
  });

  it('resets zoom and pan when a new image is selected', () => {
    const root = createTempDir();
    writeFileSync(join(root, 'a.ppm'), 'P3\n1 1\n255\n255 0 0\n');
    writeFileSync(join(root, 'b.ppm'), 'P3\n1 1\n255\n0 0 255\n');
    const ctx = createTestContext({ runtime: { columns: 96, rows: 28 } });
    const app = createImageViewerApp(ctx, { root });
    const [model] = app.init();
    const [zoomed] = app.update(keyMsg('+'), model);
    const [panned] = app.update(keyMsg('right'), zoomed);
    const [focused] = app.update(keyMsg('j'), panned);
    const [selected] = app.update(keyMsg('enter'), focused);

    expect(selected.selectedPath).toBe(realpathSync.native(join(root, 'b.ppm')));
    expect(selected.viewport).toEqual({
      zoomPercent: 100,
      panX: 0,
      panY: 0,
    });
    const text = frameText(app.view(selected) as Surface);
    expect(text).toContain('Zoom: 100%');
    expect(text).toContain('Pan: 0,0');
  });

  it('renders SVG preview glyphs with the terminal default foreground', () => {
    const ctx = createTestContext({ runtime: { columns: 120, rows: 32 } });
    const app = createImageViewerApp(ctx, { initialPath: 'assets/Bijou.svg' });
    const [model] = app.init();
    const glyphCells = brailleGlyphCells(app.view(model) as Surface);

    expect(glyphCells.length).toBeGreaterThan(20);
    expect(glyphCells.every((cell) => colorHex(cell.fg) === undefined)).toBe(true);
  });
});
