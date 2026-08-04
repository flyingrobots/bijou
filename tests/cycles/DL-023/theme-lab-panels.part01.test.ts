import { describe, expect, it } from 'vitest';
import { BIJOU_DARK, type BijouContext, type Theme } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import {
  collectLabTokens,
  swatchRow,
  widestPath,
  type LabToken,
} from '../../../examples/theme-lab/lab-tokens.js';

function labContext(theme: Theme): BijouContext {
  return createTestContext({ theme, mode: 'interactive', runtime: { columns: 120, rows: 40 } });
}

describe('theme lab token collection', () => {
  it('flattens every colour group of a preset', () => {
    const tokens = collectLabTokens(BIJOU_DARK);
    const groups = new Set(tokens.map((entry) => entry.group));
    expect([...groups].sort()).toEqual(['border', 'semantic', 'status', 'surface', 'ui']);
    expect(tokens.length).toBeGreaterThan(0);
  });

  it('reads values out of the theme rather than a copy', () => {
    const tokens = collectLabTokens(BIJOU_DARK);
    const accent = tokens.find((entry) => entry.path === 'semantic.accent');
    expect(accent?.token.hex).toBe(BIJOU_DARK.semantic.accent.hex);
  });
});

describe('swatch row width degradation', () => {
  const ctx = labContext(BIJOU_DARK);
  const tokens = collectLabTokens(BIJOU_DARK);
  const pathWidth = widestPath(tokens);

  function tokenAt(path: string): LabToken {
    const found = tokens.find((entry) => entry.path === path);
    if (found === undefined) throw new Error(`BIJOU_DARK has no token at "${path}".`);
    return found;
  }

  it('shows both hexes for a paired token when there is room', () => {
    const row = swatchRow(ctx, tokenAt('surface.primary'), pathWidth, 120);
    expect(row).toContain(`${BIJOU_DARK.surface.primary.hex}/${BIJOU_DARK.surface.primary.bg ?? ''}`);
  });

  it('falls back to the background hex alone when the pair will not fit', () => {
    const row = swatchRow(ctx, tokenAt('surface.primary'), pathWidth, 32);
    expect(row).toContain(BIJOU_DARK.surface.primary.bg ?? '');
    expect(row).not.toContain('/');
  });

  it('keeps the path when even one hex will not fit', () => {
    const row = swatchRow(ctx, tokenAt('surface.primary'), pathWidth, 12);
    expect(row).toContain('surface.primary');
    expect(row).not.toContain('#');
  });

  it('renders a flat token with its single hex', () => {
    const row = swatchRow(ctx, tokenAt('semantic.accent'), pathWidth, 120);
    expect(row).toContain(BIJOU_DARK.semantic.accent.hex);
  });
});
