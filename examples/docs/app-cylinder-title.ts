import { rasterToGlyphSurface } from '../../packages/bijou-tui/src/index.js';
import type { Surface } from '../../packages/bijou/src/index.js';
import { CYLINDER_ADVANCE, CYLINDER_LAYOUT } from './app-cylinder-font.js';
import { rasterizeCylinderGlyph, type CylinderGrid } from './app-cylinder-project.js';
import { sampleColorRamp } from './app-landing-colors.js';
import type { LandingThemeTokens } from './app-landing-types.js';

const TAU = Math.PI * 2;
const PERIOD_SECONDS = 10.8;
const LETTER_PHASE_RADIANS = 0.06 / 3.6 * TAU;

/** Jacquard 12 cylinder: four staggered words, perspective, depth and Braille coverage. */
export function paintCylinderTitle(surface: Surface, tokens: LandingThemeTokens, timeMs: number): void {
  if (surface.width < 40 || surface.height < 14) return;
  const columns = Math.min(surface.width - 4, 180);
  const rows = Math.min(Math.floor(surface.height * 0.6), 36);
  const left = Math.floor((surface.width - columns) / 2);
  const top = Math.max(0, Math.floor(surface.height * 0.3 - rows / 2));
  const width = columns * 2;
  const height = rows * 4;
  const grid: CylinderGrid = {
    width, height,
    depth: new Float32Array(width * height).fill(Infinity),
    light: new Float32Array(width * height),
  };
  const time = Number.isFinite(timeMs) ? timeMs / 1000 : 0;
  const glyphHeight = Math.max(...CYLINDER_LAYOUT.glyphs.map(({ glyph }) => glyph.geometry.height));
  const scale = Math.min(width * 0.9 / CYLINDER_ADVANCE, height * 0.45 / glyphHeight);
  const radius = height * 0.24;
  for (let row = 0; row < 4; row++) {
    CYLINDER_LAYOUT.glyphs.forEach(({ glyph, x }, index) => {
      const angle = Math.PI / 2 - time / PERIOD_SECONDS * TAU + row * TAU / 4
        + index * LETTER_PHASE_RADIANS;
      const cos = Math.cos(angle);
      if (cos <= 0.04) return;
      rasterizeCylinderGlyph(glyph, {
        scale, xOffset: (x - CYLINDER_ADVANCE / 2) * scale,
        cos, sin: Math.sin(angle), radius, focal: radius * 2.2,
        centerX: width / 2, centerY: height / 2 + Math.sin(time * 2.4) * height * 0.015,
      }, grid);
    });
  }
  paintBraille(surface, grid, left, top, columns, rows, tokens, time);
}

function paintBraille(
  surface: Surface, grid: CylinderGrid, left: number, top: number,
  columns: number, rows: number, tokens: LandingThemeTokens, time: number,
): void {
  const data = new Uint8ClampedArray(grid.width * grid.height * 4);
  for (let index = 0; index < grid.depth.length; index++) {
    if (grid.depth[index] !== Infinity) data[index * 4 + 3] = 255;
  }
  const coverage = rasterToGlyphSurface({ width: grid.width, height: grid.height, data }, {
    columns, rows, fit: 'stretch', renderer: { kind: 'braille' }, colorMode: 'none',
  });
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const char = coverage.get(x, y).char;
      if (char === ' ' || char === '\u2800') continue;
      let light = 0;
      for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          light = Math.max(light, grid.light[(y * 4 + dy) * grid.width + x * 2 + dx] ?? 0);
        }
      }
      const wave = 0.5 + 0.5 * Math.sin(x / columns * TAU - time * 1.4 + y * 0.12);
      // Keep every stroke at full ink strength; express depth through the palette.
      const foreground = sampleColorRamp(tokens.logoRamp, wave * 0.8 + light * 0.2);
      surface.set(left + x, top + y, {
        char, fg: foreground,
        bg: tokens.background, empty: false,
      });
    }
  }
}
