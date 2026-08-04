import { describe, expect, it } from 'vitest';
import {
  BIJOU_DARK,
  BIJOU_LIGHT,
  createTokenGraph,
  renameRuleAuthoredTheme,
  ruleAuthoredDefinitions,
} from '@flyingrobots/bijou';
import {
  DOGFOOD_DARK_THEME,
  DOGFOOD_LIGHT_THEME,
} from '../../../examples/docs/dogfood-shell-themes.js';

describe('rule-authored provenance', () => {
  it('is recoverable from a first-party preset', () => {
    expect(ruleAuthoredDefinitions(BIJOU_DARK)).toBeDefined();
    expect(ruleAuthoredDefinitions(BIJOU_LIGHT)).toBeDefined();
  });

  it('survives a rename', () => {
    const renamed = renameRuleAuthoredTheme(BIJOU_DARK, 'renamed-dark');
    expect(renamed.name).toBe('renamed-dark');
    expect(ruleAuthoredDefinitions(renamed)).toBe(ruleAuthoredDefinitions(BIJOU_DARK));
  });

  it('does not alias the source theme', () => {
    const renamed = renameRuleAuthoredTheme(BIJOU_DARK, 'renamed-dark');
    expect(renamed).not.toBe(BIJOU_DARK);
    expect(renamed.semantic).not.toBe(BIJOU_DARK.semantic);
    expect(renamed.semantic.accent.hex).toBe(BIJOU_DARK.semantic.accent.hex);
    expect(BIJOU_DARK.name).toBe('bijou-dark');
  });

  it('returns undefined for a theme that was never rule-authored', () => {
    expect(ruleAuthoredDefinitions({ ...BIJOU_DARK })).toBeUndefined();
  });

  it('reaches the DOGFOOD shell themes, which are renamed clones', () => {
    // A structuredClone severs the identity the provenance map is keyed on.
    // Without this, the Theme Lab cannot inspect the theme it is editing,
    // which is why it previously fell back to hand-maintained edge tables.
    expect(ruleAuthoredDefinitions(DOGFOOD_DARK_THEME)).toBeDefined();
    expect(ruleAuthoredDefinitions(DOGFOOD_LIGHT_THEME)).toBeDefined();
  });
});

describe('rule inspection through recovered definitions', () => {
  it('explains why semantic.accent won, with its full candidate set', () => {
    const definitions = ruleAuthoredDefinitions(DOGFOOD_DARK_THEME);
    expect(definitions).toBeDefined();
    if (definitions === undefined) return;

    const inspection = createTokenGraph(definitions).inspect('semantic.accent', 'dark');
    expect(inspection.kind).toBe('rule');
    if (inspection.kind !== 'rule') return;

    expect(inspection.rule).toBe('most-vivid');
    expect(inspection.hex).toBe(BIJOU_DARK.semantic.accent.hex);
    expect(inspection.selected?.path).toBe('brand.accent');

    const paths = inspection.candidates.map((candidate) => candidate.path);
    expect(paths).toContain('brand.primary');
    expect(paths).toContain('brand.info');

    const excluded = inspection.candidates
      .filter((candidate) => candidate.reasons.includes('excluded'))
      .map((candidate) => candidate.path);
    expect(excluded).toEqual(['brand.success', 'brand.error']);
  });

  it('reports the score the rule actually ranked on', () => {
    const definitions = ruleAuthoredDefinitions(BIJOU_DARK);
    if (definitions === undefined) throw new Error('BIJOU_DARK lost its definitions.');

    const inspection = createTokenGraph(definitions).inspect('semantic.accent', 'dark');
    if (inspection.kind !== 'rule') throw new Error('semantic.accent is not rule-authored.');

    // 149 is max(r,g,b) - min(r,g,b) for #f2c45d: the sRGB-range stand-in for
    // chroma that DL-023 phase 2 replaces. Surfacing it is the point — the lab
    // should show the number the rule really used, not a flattering one.
    expect(inspection.selected?.score).toBe(149);
  });
});
