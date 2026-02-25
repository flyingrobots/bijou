import { describe, it, expect } from 'vitest';
import { extendTheme } from './extend.js';
import { CYAN_MAGENTA } from './presets.js';
import type { Theme } from './tokens.js';

describe('extendTheme', () => {
  it('preserves all base theme properties (name, semantic, border)', () => {
    const extended = extendTheme(CYAN_MAGENTA, {});
    expect(extended.name).toBe(CYAN_MAGENTA.name);
    expect(extended.semantic).toEqual(CYAN_MAGENTA.semantic);
    expect(extended.border).toEqual(CYAN_MAGENTA.border);
  });

  it('returns base theme unchanged when extensions are empty', () => {
    const extended = extendTheme(CYAN_MAGENTA, {});
    expect(extended.status).toEqual(CYAN_MAGENTA.status);
    expect(extended.ui).toEqual(CYAN_MAGENTA.ui);
    expect(extended.gradient).toEqual(CYAN_MAGENTA.gradient);
  });

  it('merges new status keys', () => {
    const extended = extendTheme(CYAN_MAGENTA, {
      status: { DONE: { hex: '#00ff00' } },
    });
    expect(extended.status['DONE']).toEqual({ hex: '#00ff00' });
    expect(extended.status.success).toEqual(CYAN_MAGENTA.status.success);
  });

  it('merges new ui keys', () => {
    const extended = extendTheme(CYAN_MAGENTA, {
      ui: { customWidget: { hex: '#abcdef' } },
    });
    expect(extended.ui['customWidget']).toEqual({ hex: '#abcdef' });
    expect(extended.ui.cursor).toEqual(CYAN_MAGENTA.ui.cursor);
  });

  it('merges new gradient keys', () => {
    const extended = extendTheme(CYAN_MAGENTA, {
      gradient: {
        custom: [
          { pos: 0, color: [255, 0, 0] },
          { pos: 1, color: [0, 0, 255] },
        ],
      },
    });
    expect(extended.gradient['custom']).toEqual([
      { pos: 0, color: [255, 0, 0] },
      { pos: 1, color: [0, 0, 255] },
    ]);
    expect(extended.gradient.brand).toEqual(CYAN_MAGENTA.gradient.brand);
  });

  it('overrides existing keys when specified', () => {
    const override = { hex: '#111111' };
    const extended = extendTheme(CYAN_MAGENTA, {
      status: { success: override } as any,
    });
    expect(extended.status.success).toEqual(override);
  });

  it('extended theme is assignable to Theme (for createThemeResolver)', () => {
    const extended = extendTheme(CYAN_MAGENTA, {
      status: { CUSTOM: { hex: '#aabbcc' } },
    });
    // Structural assignability: extended theme satisfies Theme
    const asBase: Theme = extended;
    expect(asBase.name).toBe(CYAN_MAGENTA.name);
  });
});
