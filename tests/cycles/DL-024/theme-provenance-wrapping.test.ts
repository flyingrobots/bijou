import { describe, expect, it } from 'vitest';
import { BIJOU_DARK } from '@flyingrobots/bijou';
import { themeLabProvenanceLines } from '../../../examples/docs/app-theme-lab-provenance.js';
import { renderThemeLabProvenanceSurface } from '../../../examples/docs/app-theme-lab-provenance-view.js';

const tokens = {
  accent: BIJOU_DARK.semantic.accent,
  body: BIJOU_DARK.surface.primary,
  muted: BIJOU_DARK.surface.muted,
};

describe('provenance surface wrapping', () => {
  it.each([1, 8, 20, 50, 100])('preserves every inspection character at width %i', (width) => {
    const lines = themeLabProvenanceLines(BIJOU_DARK, 'semantic.accent', 'dark');
    const surface = renderThemeLabProvenanceSurface(BIJOU_DARK, 'semantic.accent', width, tokens);
    const text = Array.from({ length: surface.height }, (_, y) => (
      surface.getRow(y).map((cell) => cell.char).join('')
    )).join('');
    const expected = lines.map((line) => line.text).join('');

    expect(surface.width).toBe(width);
    expect(text.replace(/\s/g, '')).toBe(expected.replace(/\s/g, ''));
    if (width <= 50) expect(surface.height).toBeGreaterThan(lines.length);
  });
});
