import { describe, expect, it } from 'vitest';
import {
  createSapphireReferencePalette,
  hexToRgb,
  rgbToOklch,
  SAPPHIRE_HUE,
} from './index.js';

function hueDistance(a: number, b: number): number {
  const direct = Math.abs(a - b) % 360;
  return Math.min(direct, 360 - direct);
}

function values(record: object): readonly string[] {
  return Object.values(record).filter((value): value is string => typeof value === 'string');
}

describe('Sapphire Noir reference palette', () => {
  it('derives dark and light brand families from one hue anchor', () => {
    for (const mode of ['dark', 'light'] as const) {
      const palette = createSapphireReferencePalette(mode);
      for (const key of ['primary', 'accent'] as const) {
        const hue = rgbToOklch(hexToRgb(palette.brand[key])).h;
        expect(hueDistance(hue, SAPPHIRE_HUE), `${mode} brand.${key}`).toBeLessThan(2);
      }
    }
  });

  it('moves both modes when the shared hue seed changes', () => {
    const changedHue = 25;
    for (const mode of ['dark', 'light'] as const) {
      const baseline = createSapphireReferencePalette(mode);
      const changed = createSapphireReferencePalette(mode, { brandHue: changedHue });
      expect(Object.keys(changed)).toEqual(Object.keys(baseline));
      expect(Object.keys(changed.brand)).toEqual(Object.keys(baseline.brand));
      expect(changed.brand.primary).not.toBe(baseline.brand.primary);
      const hue = rgbToOklch(hexToRgb(changed.brand.primary)).h;
      expect(hueDistance(hue, changedHue)).toBeLessThan(2);
    }
  });

  it('keeps reference output deterministic and valid', () => {
    for (const mode of ['dark', 'light'] as const) {
      const first = createSapphireReferencePalette(mode);
      expect(createSapphireReferencePalette(mode)).toEqual(first);
      for (const group of [first.ink, first.brand, first.surfaceBase, first.borderBase, first.uiBase]) {
        expect(Object.isFrozen(group)).toBe(true);
        for (const color of values(group)) expect(color).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
  });

  it('rejects non-finite seed values instead of emitting invalid hex', () => {
    expect(() => createSapphireReferencePalette('dark', { brandHue: Number.NaN }))
      .toThrow('Sapphire palette hue seeds must be finite numbers');
  });

  it('rejects unsupported runtime modes instead of silently choosing light', () => {
    expect(() => { Reflect.apply(createSapphireReferencePalette, undefined, ['sepia']); })
      .toThrow('Unsupported Sapphire palette mode: sepia');
  });

  it('orders surface lightness into a visible depth hierarchy', () => {
    const dark = createSapphireReferencePalette('dark').surfaceBase;
    expect(rgbToOklch(hexToRgb(dark.overlay)).l).toBeLessThan(rgbToOklch(hexToRgb(dark.primary)).l);
    expect(rgbToOklch(hexToRgb(dark.primary)).l).toBeLessThan(rgbToOklch(hexToRgb(dark.secondary)).l);
    expect(rgbToOklch(hexToRgb(dark.secondary)).l).toBeLessThan(rgbToOklch(hexToRgb(dark.elevated)).l);

    const light = createSapphireReferencePalette('light').surfaceBase;
    expect(rgbToOklch(hexToRgb(light.muted)).l).toBeLessThan(rgbToOklch(hexToRgb(light.primary)).l);
    expect(rgbToOklch(hexToRgb(light.primary)).l).toBeLessThan(rgbToOklch(hexToRgb(light.elevated)).l);
  });

  it('reserves warning rather than reusing the interactive accent', () => {
    for (const mode of ['dark', 'light'] as const) {
      const { brand } = createSapphireReferencePalette(mode);
      expect(brand.warning).not.toBe(brand.accent);
      expect(brand.info).not.toBe(brand.primary);
    }
  });
});
