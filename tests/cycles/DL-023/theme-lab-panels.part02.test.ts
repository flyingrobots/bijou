import { describe, expect, it } from 'vitest';
import {
  BIJOU_DARK,
  BIJOU_LIGHT,
  PRESETS,
  surfaceToString,
  type BijouContext,
  type Surface,
  type Theme,
} from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { collectLabTokens } from '../../../examples/theme-lab/lab-tokens.js';
import { contrastPanel } from '../../../examples/theme-lab/panel-contrast.js';
import { derivationSummary, swatchPanel } from '../../../examples/theme-lab/panel-swatches.js';
import { feedbackPanel, structurePanel } from '../../../examples/theme-lab/panel-components.js';
import { LAB_SHELL_THEMES } from '../../../examples/theme-lab/lab-themes.js';

function labContext(theme: Theme): BijouContext {
  return createTestContext({ theme, mode: 'interactive', runtime: { columns: 120, rows: 40 } });
}

function render(ctx: BijouContext, surface: Surface): string {
  return surfaceToString(surface, ctx.style);
}

describe('contrast panel', () => {
  it('reports a measured ratio and verdict for every semantic token', () => {
    const ctx = labContext(BIJOU_DARK);
    const text = render(ctx, contrastPanel(ctx, BIJOU_DARK, 120, 60));
    expect(text).toContain('semantic.accent');
    expect(text).toContain('status.error');
    expect(text).toMatch(/\d+\.\d{2}/);
  });

  it('surfaces the accent/warning role collision shipped in BIJOU_DARK', () => {
    const ctx = labContext(BIJOU_DARK);
    const text = render(ctx, contrastPanel(ctx, BIJOU_DARK, 120, 60));
    const accent = BIJOU_DARK.semantic.accent.hex.toLowerCase();

    expect(BIJOU_DARK.status.warning.hex.toLowerCase()).toBe(accent);
    expect(text).toContain('ROLE COLLISIONS');
    const collisionLine = text.split('\n').find((line) => line.toLowerCase().includes(accent));
    expect(collisionLine).toContain('semantic.accent');
    expect(collisionLine).toContain('status.warning');
  });

  it('surfaces the brand.primary/brand.info collision shipped in BIJOU_LIGHT', () => {
    const ctx = labContext(BIJOU_LIGHT);
    const text = render(ctx, contrastPanel(ctx, BIJOU_LIGHT, 120, 60));
    expect(BIJOU_LIGHT.semantic.info.hex).toBe('#285c9e');
    expect(text).toContain('ROLE COLLISIONS');
  });
});

describe('derivation summary', () => {
  it('counts distinct colours against total tokens', () => {
    const tokens = collectLabTokens(BIJOU_DARK);
    const distinct = new Set(tokens.map((entry) => entry.token.hex.toLowerCase()));
    expect(derivationSummary(BIJOU_DARK)).toBe(
      `${String(distinct.size)} colours / ${String(tokens.length)} tokens`,
    );
  });

  it('reports fewer distinct colours than tokens, because the preset aliases heavily', () => {
    const tokens = collectLabTokens(BIJOU_DARK);
    const distinct = new Set(tokens.map((entry) => entry.token.hex.toLowerCase()));
    expect(distinct.size).toBeLessThan(tokens.length);
  });

  it('returns plain text, since the frame sanitizes the help line', () => {
    // A styled summary would lose its ESC prefix to the frame sanitizer and
    // render the remainder as literal "[38;2;...m" noise in the help line.
    expect(derivationSummary(BIJOU_DARK)).not.toContain(String.fromCharCode(27));
    expect(derivationSummary(BIJOU_DARK)).not.toContain('[38;2;');
  });
});

describe('every built-in preset renders every panel', () => {
  for (const [id, theme] of Object.entries(PRESETS)) {
    it(`renders ${id} without throwing`, () => {
      const ctx = labContext(theme);
      expect(() => render(ctx, swatchPanel(ctx, theme, ['surface', 'semantic'], 60, 30))).not.toThrow();
      expect(() => render(ctx, swatchPanel(ctx, theme, ['border', 'ui'], 60, 30))).not.toThrow();
      expect(() => render(ctx, contrastPanel(ctx, theme, 120, 60))).not.toThrow();
      expect(() => render(ctx, feedbackPanel(ctx, 60, 30))).not.toThrow();
      expect(() => render(ctx, structurePanel(ctx, 60, 30))).not.toThrow();
    });
  }
});

describe('lab shell themes', () => {
  it('offers every built-in preset exactly once', () => {
    const offered = LAB_SHELL_THEMES.flatMap((spec) =>
      spec.modes === undefined ? [spec.theme] : spec.modes.map((mode) => mode.theme),
    );
    expect(offered).toHaveLength(Object.keys(PRESETS).length);
    expect(new Set(offered).size).toBe(Object.keys(PRESETS).length);
  });

  it('pairs the first-party presets as one mode-aware family', () => {
    const family = LAB_SHELL_THEMES.find((spec) => spec.id === 'bijou');
    expect(family?.modes?.map((mode) => mode.theme)).toEqual([BIJOU_DARK, BIJOU_LIGHT]);
  });
});
