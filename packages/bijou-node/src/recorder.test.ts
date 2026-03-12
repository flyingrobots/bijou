import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createSurface } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import type { App } from '@flyingrobots/bijou-tui';
import { recordDemoGif, rasterizeSurface, writeSurfaceGif } from './recorder.js';

describe('recorder', () => {
  it('rasterizes cell foreground and background colors', () => {
    const surface = createSurface(1, 1);
    surface.set(0, 0, {
      char: 'A',
      fg: '#112233',
      bg: '#445566',
      empty: false,
    });

    const rgba = rasterizeSurface(surface, {
      cellWidth: 8,
      cellHeight: 10,
    });

    expect(Array.from(rgba.slice(0, 4))).toEqual([0x44, 0x55, 0x66, 0xff]);
    expect(rgba.some((value, index) => index % 4 !== 3 && value === 0x11)).toBe(true);
  });

  it('writes a GIF89a file for a scripted app', async () => {
    const ctx = createTestContext({
      runtime: { columns: 20, rows: 6 },
    });

    const app: App<number> = {
      init: () => [0, []],
      update: (msg, model) => {
        if ('type' in msg && msg.type === 'key' && msg.key === ' ') return [model + 1, []];
        return [model, []];
      },
      view: (model) => {
        const surface = createSurface(12, 3);
        surface.set(0, 0, { char: '0', fg: '#ffffff', bg: '#000000', empty: false });
        surface.set(1, 0, { char: String(model), fg: '#00ff00', bg: '#000000', empty: false });
        return surface;
      },
    };

    const dir = mkdtempSync(join(tmpdir(), 'bijou-recorder-'));
    const outputPath = join(dir, 'demo.gif');

    const result = await recordDemoGif({
      name: 'test-demo',
      app,
      ctx,
      steps: [{ key: ' ' }],
      outputPath,
      frameDelayMs: 80,
    });

    const bytes = readFileSync(outputPath);
    expect(bytes.subarray(0, 6).toString('ascii')).toBe('GIF89a');
    expect(result.frames).toBe(2);
  });

  it('normalizes resized frames to a stable GIF canvas', () => {
    const dir = mkdtempSync(join(tmpdir(), 'bijou-recorder-'));
    const outputPath = join(dir, 'resized.gif');
    const first = createSurface(2, 1);
    first.set(0, 0, { char: 'A', fg: '#ffffff', bg: '#000000', empty: false });
    const second = createSurface(4, 2);
    second.set(3, 1, { char: 'B', fg: '#00ff00', bg: '#000000', empty: false });

    const result = writeSurfaceGif({
      outputPath,
      frames: [first, second],
      cellWidth: 8,
      cellHeight: 10,
      frameDelayMs: 80,
    });

    const bytes = readFileSync(outputPath);
    const gifWidth = bytes.readUInt16LE(6);
    const gifHeight = bytes.readUInt16LE(8);

    expect(result.width).toBe(32);
    expect(result.height).toBe(20);
    expect(gifWidth).toBe(32);
    expect(gifHeight).toBe(20);
  });
});
