import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';

import { join } from 'node:path';

import { tmpdir } from 'node:os';

import { afterEach, describe, expect, it } from 'vitest';

import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { type Surface } from '@flyingrobots/bijou';

import { createImageViewerApp } from '../examples/image-viewer/main.js';

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

function brailleGlyphCells(frame: Surface): ReturnType<Surface['get']>[] {
  const cells: ReturnType<Surface['get']>[] = [];
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      const cell = frame.get(x, y);
      const codePoint = cell.char.codePointAt(0);
      if (codePoint !== undefined && codePoint > 0x2800 && codePoint <= 0x28ff) {
        cells.push(cell);
      }
    }
  }
  return cells;
}

describe('image viewer app', () => {
  it('can preserve sampled image colors on rendered glyphs', () => {
    const root = createTempDir();
    writeFileSync(join(root, 'sample.ppm'), 'P3\n2 1\n255\n255 255 255 0 0 0\n');
    const ctx = createTestContext({ runtime: { columns: 180, rows: 28 } });
    const app = createImageViewerApp(ctx, { root });
    const [model] = app.init();
    const [colored] = app.update(keyMsg('c'), model);
    const glyphCells = brailleGlyphCells(app.view(colored));
    const text = frameText(app.view(colored));

    expect(colored.tuning.colorMode).toBe('fg-bg');
    expect(glyphCells.some((cell) => {
      const bg = cell.bgRGB;
      return bg?.[0] === 255 && bg[1] === 255 && bg[2] === 255;
    }))
      .toBe(true);
    expect(text).toContain('Color: full color');
  });
});
