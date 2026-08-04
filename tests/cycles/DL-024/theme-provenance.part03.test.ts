import { describe, expect, it } from 'vitest';
import { BIJOU_DARK, PRESETS } from '@flyingrobots/bijou';
import { themeLabProvenanceLines } from '../../../examples/docs/app-theme-lab-provenance.js';
import { DOGFOOD_DARK_THEME } from '../../../examples/docs/dogfood-shell-themes.js';

function textOf(theme = BIJOU_DARK, path = 'semantic.accent'): string {
  return themeLabProvenanceLines(theme, path, 'dark').map((entry) => entry.text).join('\n');
}

describe('theme lab provenance', () => {
  it('names the rule and the value it produced', () => {
    const text = textOf();
    expect(text).toContain('rule most-vivid');
    expect(text).toContain(BIJOU_DARK.semantic.accent.hex);
  });

  it('shows every candidate the rule weighed, winners and losers alike', () => {
    const lines = themeLabProvenanceLines(BIJOU_DARK, 'semantic.accent', 'dark');
    const text = lines.map((entry) => entry.text).join('\n');

    expect(text).toContain('considered 5 candidates');
    for (const path of ['brand.primary', 'brand.accent', 'brand.success', 'brand.error', 'brand.info']) {
      expect(text).toContain(path);
    }
    expect(text).toMatch(/WON\s+brand\.accent/);
    expect(text).toMatch(/skip\s+brand\.success/);
    expect(text).toMatch(/skip\s+brand\.error/);
  });

  it('carries a swatch on every line that names a colour', () => {
    const lines = themeLabProvenanceLines(BIJOU_DARK, 'semantic.accent', 'dark');
    const candidates = lines.filter((entry) => entry.text.includes('brand.'));
    expect(candidates).toHaveLength(5);
    for (const candidate of candidates) expect(candidate.swatch).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('reports the ranking score, so a wrong metric is visible rather than hidden', () => {
    // score 149 is max(r,g,b)-min(r,g,b) for #f2c45d. DL-023 phase 2 replaces
    // that stand-in with OKLCH chroma; until then the lab shows the real number.
    expect(textOf()).toContain('score  149');
  });

  it('distinguishes a reference from a literal', () => {
    expect(textOf(BIJOU_DARK, 'status.success')).toContain('defers to brand.success');

    const literal = textOf(BIJOU_DARK, 'brand.accent');
    expect(literal).toContain('literal');
    expect(literal).toContain('cannot re-decide');
  });

  it('explains rather than throws for a token field that has no rule', () => {
    const text = textOf(BIJOU_DARK, 'surface.primary.bg');
    expect(text).toContain('field of a token');
  });

  it('works through the DOGFOOD theme the lab actually edits', () => {
    expect(textOf(DOGFOOD_DARK_THEME)).toContain('rule most-vivid');
  });

  it('degrades honestly for a preset with no rule provenance', () => {
    const nord = PRESETS['nord'];
    if (nord === undefined) throw new Error('nord preset is missing.');
    expect(textOf(nord)).toContain('flat token values');
  });
});
