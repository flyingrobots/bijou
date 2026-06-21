
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';

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

describe('image viewer app', () => {
it('adjusts threshold, contrast, and ordered dithering from preview keys', () => {
    const root = createTempDir();
    writeFileSync(join(root, 'sample.ppm'), 'P3\n1 1\n255\n128 128 128\n');
    const ctx = createTestContext({ runtime: { columns: 220, rows: 28 } });
    const app = createImageViewerApp(ctx, { root });
    const [model] = app.init();
    const [thresholdUp] = app.update(keyMsg(']'), model);
    const [contrastUp] = app.update(keyMsg('.'), thresholdUp);
    const [dithered] = app.update(keyMsg('d'), contrastUp);
    const text = frameText(app.view(dithered));

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
});

describe('image viewer app', () => {
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
    const text = frameText(app.view(selected));
    expect(text).toContain('b.ppm');
    expect(text).toContain('Format: PPM');
  });
});
