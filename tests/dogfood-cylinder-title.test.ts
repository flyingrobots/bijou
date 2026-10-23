import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { RasterFontGlyph } from '../packages/bijou-tui/src/index.js';
import { CYLINDER_ADVANCE, CYLINDER_LAYOUT } from '../examples/docs/app-cylinder-font.js';
import { CURRENT_DOGFOOD_RELEASE_TITLE, renderDogfoodReleaseTitleText } from '../examples/docs/release-title.js';

const GEOMETRY = { advance: 1, left: 0, top: 0, width: 1, height: 1, columns: 1, rows: 1 };

describe('offline Jacquard cylinder font', () => {
  it('keeps the pinned Google Fonts source, license and five real glyph textures', () => {
    const font = readFileSync(new URL('../assets/fonts/jacquard12/Jacquard12-Regular.ttf', import.meta.url));
    expect(createHash('sha256').update(font).digest('hex')).toBe('b1560583565a37f3d3a25cf2572df3efd2d773ecdcbb459dcd7ea0398cb840d1');
    const license = readFileSync(new URL('../assets/fonts/jacquard12/OFL.txt', import.meta.url), 'utf8');
    expect(license).toContain('SIL OPEN FONT LICENSE Version 1.1');
    expect(CYLINDER_LAYOUT.glyphs).toHaveLength(5);
    expect(CYLINDER_ADVANCE).toBeGreaterThan(200);
    for (const { glyph } of CYLINDER_LAYOUT.glyphs) {
      const g = glyph.geometry;
      let coverage = 0;
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 20; x++) {
          if (glyph.sample(g.left + (x + 0.5) * g.width / 20, g.top + (y + 0.5) * g.height / 20)) coverage++;
        }
      }
      expect(coverage).toBeGreaterThan(10);
      expect(coverage).toBeLessThan(390);
    }
  });

  it('owns coverage bytes and rejects malformed texture dimensions', () => {
    const mask = new Uint8Array([1]);
    const glyph = new RasterFontGlyph(GEOMETRY, mask);
    mask[0] = 0;
    expect(glyph.sample(0.5, 0.5)).toBe(true);
    expect(glyph.sample(-1, 0)).toBe(false);
    expect(glyph.sample(1, 1)).toBe(false);
    expect(() => new RasterFontGlyph({ ...GEOMETRY, rows: 2049 }, mask)).toThrow();
    expect(() => new RasterFontGlyph({ ...GEOMETRY, width: NaN }, mask)).toThrow();
    expect(() => new RasterFontGlyph(GEOMETRY, new Uint8Array())).toThrow();
  });

  it.each(['static', 'pipe', 'accessible'] as const)('preserves V8 meaning without animation in %s output', (mode) => {
    const output = renderDogfoodReleaseTitleText({ mode, width: 100 });
    expect(CURRENT_DOGFOOD_RELEASE_TITLE.id).toBe('v8');
    expect(output).toContain('Bijou v8');
    expect(output).not.toMatch(/[\u2800-\u28ff]/u);
    expect(output).not.toContain('\u001b');
    expect(output).not.toContain('v8.0.0 released');
  });
});
