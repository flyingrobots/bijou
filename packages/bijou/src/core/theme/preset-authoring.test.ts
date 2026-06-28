import { describe, expect, it } from 'vitest';
import { createResolved } from './resolve.js';
import { BIJOU_DARK, BIJOU_LIGHT } from './presets.js';

describe('rule-authored first-party presets', () => {
  it('exposes bijou-dark accent selection provenance in the resolved token graph', () => {
    const resolved = createResolved(BIJOU_DARK, false, 'dark');
    const inspection = resolved.tokenGraph.inspect('semantic.accent', 'dark');

    expect(inspection.kind).toBe('rule');
    if (inspection.kind !== 'rule') throw new Error('semantic.accent should be rule-authored');
    expect(inspection.rule).toBe('most-vivid');
    expect(inspection.hex).toBe(BIJOU_DARK.semantic.accent.hex);
    expect(inspection.selected?.path).toBe('brand.accent');
    expect(inspection.dependencies).toContain('surface.primary.bg');
    expect(inspection.dependencies).toContain('brand.success');
    expect(inspection.dependencies).toContain('brand.error');
  });

  it('uses a contrast rule for bijou-light primary text selection', () => {
    const resolved = createResolved(BIJOU_LIGHT, false, 'light');
    const inspection = resolved.tokenGraph.inspect('decision.primaryText', 'light');

    expect(inspection.kind).toBe('rule');
    if (inspection.kind !== 'rule') throw new Error('decision.primaryText should be rule-authored');
    expect(inspection.rule).toBe('min-contrast-with');
    expect(inspection.hex).toBe(BIJOU_LIGHT.semantic.primary.hex);
    expect(inspection.selected?.path).toBe('ink.primary');
    expect(inspection.dependencies).toContain('surface.primary.bg');
    expect(inspection.dependencies).toContain('ink.primary');
  });
});
