import { describe, expect, it } from 'vitest';
import { mirrorGlyph, mirrorGlyphs } from './directional-glyph.js';

describe('mirrorGlyph', () => {
  it('maps directional pairs both ways under rtl', () => {
    const pairs: readonly (readonly [string, string])[] = [
      ['‹', '›'], ['▸', '◂'], ['▶', '◀'], ['►', '◄'], ['→', '←'], ['⇒', '⇐'], ['«', '»'], ['⟩', '⟨'],
    ];
    for (const [a, b] of pairs) {
      expect(mirrorGlyph(a, 'rtl')).toBe(b);
      expect(mirrorGlyph(b, 'rtl')).toBe(a);
    }
  });

  it('leaves every glyph unchanged under ltr', () => {
    expect(mirrorGlyph('›', 'ltr')).toBe('›');
    expect(mirrorGlyph('▸', 'ltr')).toBe('▸');
  });

  it('leaves non-directional glyphs unchanged under rtl', () => {
    for (const glyph of ['•', '▾', '│', 'x', '/', '>', '<', '']) {
      expect(mirrorGlyph(glyph, 'rtl')).toBe(glyph);
    }
  });
});

describe('mirrorGlyphs', () => {
  it('mirrors every directional glyph in a separator string', () => {
    expect(mirrorGlyphs(' › ', 'rtl')).toBe(' ‹ ');
    expect(mirrorGlyphs('▸ → ‹', 'rtl')).toBe('◂ ← ›');
    expect(mirrorGlyphs(' › ', 'ltr')).toBe(' › ');
  });

  it('does not reorder or touch ASCII code, paths, or IDs', () => {
    expect(mirrorGlyphs('src/a->b.ts #612', 'rtl')).toBe('src/a->b.ts #612');
  });
});
