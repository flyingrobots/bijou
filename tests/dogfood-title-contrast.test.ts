import { describe, expect, it } from 'vitest';
import { colorHex, createSurface } from '../packages/bijou/src/index.js';
import { contrastRatio } from '../examples/docs/app-landing-colors.js';
import { paintLandingBackground } from '../examples/docs/app-landing-background.js';
import { paintCylinderTitle } from '../examples/docs/app-cylinder-title.js';
import { resolveLandingQuality } from '../examples/docs/app-landing-quality.js';
import { docsVisualThemeFromShellThemeChoice } from '../examples/docs/app-landing-themes.js';
import { createDogfoodBookTheme } from '../examples/docs/dogfood-book-theme.js';

function tokens(mode: 'dark' | 'light') {
  return docsVisualThemeFromShellThemeChoice({ id: mode, label: mode, theme: createDogfoodBookTheme(mode) });
}

describe('title and backdrop color hierarchy', () => {
  it.each(['dark', 'light'] as const)('keeps decorative %s ink quiet and softer behind the title', (mode) => {
    const theme = tokens(mode);
    const surface = createSurface(120, 40);
    paintLandingBackground(surface, 0, theme, resolveLandingQuality(120, 40));
    for (let y = 0; y < 40; y++) {
      for (let x = 0; x < 120; x++) {
        const foreground = colorHex(surface.get(x, y).fg);
        if (foreground == null) throw new Error('Backdrop ink is missing.');
        expect(contrastRatio(foreground, theme.background)).toBeLessThanOrEqual(1.45);
      }
    }
    const near = colorHex(surface.get(60, 12).fg);
    const far = colorHex(surface.get(0, 39).fg);
    if (near == null || far == null) throw new Error('Backdrop sample is missing.');
    expect(contrastRatio(near, theme.background)).toBeLessThanOrEqual(1.08);
    expect(contrastRatio(far, theme.background)).toBeGreaterThan(contrastRatio(near, theme.background) + 0.2);
  });

  it.each(['dark', 'light'] as const)('keeps every painted %s letter stroke above 6:1 throughout sampled rotation phases', (mode) => {
    const theme = tokens(mode);
    const palette = new Set(theme.logoRamp);
    for (const color of palette) expect(contrastRatio(color, theme.background)).toBeGreaterThanOrEqual(6);
    for (const time of [0, 900, 1800, 3600, 5400, 8100]) {
      const surface = createSurface(120, 40, { char: ' ', bg: theme.background });
      paintCylinderTitle(surface, theme, time);
      let count = 0;
      for (let y = 0; y < surface.height; y++) {
        for (let x = 0; x < surface.width; x++) {
          const cell = surface.get(x, y);
          const point = cell.char.codePointAt(0) ?? 0;
          if (point <= 0x2800 || point > 0x28ff) continue;
          const foreground = colorHex(cell.fg);
          if (foreground == null) throw new Error('Title ink is missing.');
          expect(palette.has(foreground)).toBe(true);
          expect(contrastRatio(foreground, theme.background)).toBeGreaterThanOrEqual(6);
          count++;
        }
      }
      expect(count).toBeGreaterThan(100);
    }
  });
});
