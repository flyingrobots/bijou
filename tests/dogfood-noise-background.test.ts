import { describe, expect, it } from 'vitest';
import { createSurface } from '../packages/bijou/src/index.js';
import { landingNoiseDensity, landingPerlinNoise } from '../examples/docs/app-landing-noise.js';
import { paintLandingBackground } from '../examples/docs/app-landing-background.js';
import { resolveLandingQuality } from '../examples/docs/app-landing-quality.js';
import { resolveLandingTheme } from '../examples/docs/app-landing-themes.js';

function frame(timeMs: number) {
  const surface = createSurface(120, 40);
  paintLandingBackground(surface, timeMs, resolveLandingTheme(0), resolveLandingQuality(120, 40));
  return surface;
}

function characters(surface: ReturnType<typeof frame>): string {
  let result = '';
  for (let y = 0; y < surface.height; y++) {
    for (let x = 0; x < surface.width; x++) result += surface.get(x, y).char;
  }
  return result;
}

describe('ASCII noise backdrop', () => {
  it('has smooth lattice boundaries and deterministic samples without mutable state', () => {
    const sample = landingPerlinNoise(-2.3, 0.45, 1.1);
    landingPerlinNoise(100, -300, 200);
    expect(landingPerlinNoise(-2.3, 0.45, 1.1)).toBe(sample);
    for (const x of [-1, 0, 1]) {
      expect(landingPerlinNoise(x, 2, 3)).toBe(0);
      expect(Math.abs(landingPerlinNoise(x - 0.000001, 0.45, 1.1)
        - landingPerlinNoise(x + 0.000001, 0.45, 1.1))).toBeLessThan(0.0001);
    }
  });

  it('renders coherent ASCII density on one explicit theme background and evolves over time', () => {
    const initial = frame(0);
    const first = characters(initial);
    const later = characters(frame(5000));
    expect(first).toMatch(/^[ .,\-~:;=!*#$@]+$/u);
    expect(new Set(first).size).toBeGreaterThanOrEqual(6);
    expect(first).toBe(characters(frame(0)));
    expect(Array.from(first).filter((char, index) => char !== later[index]).length).toBeGreaterThan(100);
    const backgrounds = new Set([initial.get(0, 0).bg]);
    for (let y = 0; y < initial.height; y++) {
      for (let x = 0; x < initial.width; x++) {
        const cell = initial.get(x, y);
        expect(cell.empty).toBe(false);

        backgrounds.add(cell.bg);
        const density = landingNoiseDensity(x, y, 0);
        expect(density).toBeGreaterThanOrEqual(0);
        expect(density).toBeLessThanOrEqual(1);
      }
    }
    expect([...backgrounds]).toEqual([resolveLandingTheme(0).background]);
  });

  it('clears old pixels and paints clipped quality tiles at odd viewport sizes', () => {
    const surface = createSurface(13, 7, { char: 'X', bg: '#ffffff', empty: false });
    paintLandingBackground(surface, 1000, resolveLandingTheme(0), resolveLandingQuality(13, 7, 'performance'));
    expect(characters(surface)).not.toContain('X');
    expect(surface.get(12, 6).bg).toBe(resolveLandingTheme(0).background);
    expect(surface.get(12, 6).empty).toBe(false);
  });
});
