
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

describe('image viewer app', () => {
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
    expect(frameText(app.view(zoomedIn))).toContain('Zoom: 125%');
  });
});
