import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import opentype from 'opentype.js';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { FontRasterizer } from '../examples/markdown-font/font-rasterizer.js';
import { loadFont } from '../examples/markdown-font/load-font.js';
import { readBoundedFile } from '../examples/markdown-font/read-file.js';
import { rasterizeText } from '../packages/bijou-tui/src/index.js';

describe('Markdown font file boundaries', () => {
  it('loads a user-supplied font and rejects files beyond the declared limit', async () => {
    const ctx = createTestContext();
    const font = await loadFont({ path: 'unused.md', fontPath: 'assets/fonts/jacquard12/Jacquard12-Regular.ttf', offline: false, raster: true }, ctx);
    expect(font.forText('Bijou')?.family).toContain('Jacquard12-Regular.ttf');
    const dir = await mkdtemp(join(tmpdir(), 'bijou-markdown-font-'));
    try {
      const path = join(dir, 'document.md');
      await writeFile(path, '12345');
      expect(new TextDecoder().decode(await readBoundedFile(path, 5))).toBe('12345');
      await expect(readBoundedFile(path, 4)).rejects.toThrow('limit');
      await expect(readBoundedFile(dir, 100)).rejects.toThrow();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('renders a local OpenType font with cubic outlines', () => {
    const path = new opentype.Path();
    path.moveTo(0, 0);
    path.curveTo(0, 700, 500, 700, 500, 0);
    path.lineTo(0, 0);
    path.close();
    const source = new opentype.Font({
      familyName: 'Cubic fixture', styleName: 'Regular', unitsPerEm: 1000,
      ascender: 800, descender: -200,
      glyphs: [new opentype.Glyph({ name: '.notdef', advanceWidth: 500, path: new opentype.Path() }),
        new opentype.Glyph({ name: 'A', unicode: 65, advanceWidth: 600, path })],
    });
    const rasterizer = new FontRasterizer(new Uint8Array(source.toArrayBuffer()), 'Cubic fixture');
    const font = rasterizer.forText('A');
    expect(font).toBeDefined();
    if (font === undefined) throw new Error('Missing fixture font.');
    const frame = rasterizeText('A', font, { height: 24 });
    expect(frame.data.some((value) => value > 0)).toBe(true);
  });
});
