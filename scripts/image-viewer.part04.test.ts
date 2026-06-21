
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';

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
    expect(frameText(app.view(model))).toContain('> * - sample.ppm');
  });
});

describe('image viewer app', () => {
it('hot-swaps the selected image renderer from Braille to ASCII', () => {
    const root = createTempDir();
    writeFileSync(join(root, 'sample.ppm'), 'P3\n2 1\n255\n255 255 255 0 0 0\n');
    const ctx = createTestContext({ runtime: { columns: 96, rows: 28 } });
    const app = createImageViewerApp(ctx, { root });
    const [model] = app.init();
    const [next] = app.update(keyMsg('m'), model);

    expect(next.mode).toBe('ascii');
    expect(frameText(app.view(next))).toContain('Mode: ascii');
  });
});
