
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
it('keeps selected and focused image rows visually distinct', () => {
    const root = createTempDir();
    writeFileSync(join(root, 'a.ppm'), 'P3\n1 1\n255\n255 0 0\n');
    writeFileSync(join(root, 'b.ppm'), 'P3\n1 1\n255\n0 0 255\n');
    const ctx = createTestContext({ runtime: { columns: 96, rows: 28 } });
    const app = createImageViewerApp(ctx, { root });
    const [model] = app.init();
    const [focused] = app.update(keyMsg('j'), model);
    const text = frameText(app.view(focused));

    expect(text).toContain('  * - a.ppm');
    expect(text).toContain('>   - b.ppm');
  });
});

describe('image viewer app', () => {
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
    const text = frameText(app.view(pannedDown));
    expect(text).toContain('Pan: +4,+2');
  });
});
