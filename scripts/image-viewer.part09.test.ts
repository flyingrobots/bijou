
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';

import { join } from 'node:path';

import { tmpdir } from 'node:os';

import { afterEach, describe, expect, it } from 'vitest';

import { createTestContext } from '@flyingrobots/bijou/adapters/test';

import { colorHex, type Surface } from '@flyingrobots/bijou';

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
    const text = frameText(app.view(selected));
    expect(text).toContain('Zoom: 100%');
    expect(text).toContain('Pan: 0,0');
  });
});

describe('image viewer app', () => {
it('renders SVG preview glyphs with the terminal default foreground', () => {
    const ctx = createTestContext({ runtime: { columns: 120, rows: 32 } });
    const app = createImageViewerApp(ctx, { initialPath: 'assets/Bijou.svg' });
    const [model] = app.init();
    const glyphCells = brailleGlyphCells(app.view(model));

    expect(glyphCells.length).toBeGreaterThan(20);
    expect(glyphCells.every((cell) => colorHex(cell.fg) === undefined)).toBe(true);
  });
});
