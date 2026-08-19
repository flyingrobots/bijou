import { describe, expect, it } from 'vitest';
import {
  deltaEOk,
  hexToRgb,
  rgbToAnsi16,
  rgbToAnsi256,
  rgbToOklab,
  rgbToOklch,
  themeContrastRatio,
} from './index.js';
import { BIJOU_DARK, BIJOU_LIGHT } from './presets.js';
import type { Theme } from './tokens.js';

const SEMANTIC_ROLES = ['accent', 'success', 'warning', 'error', 'info'] as const;

function backgrounds(theme: Theme): readonly string[] {
  return Object.values(theme.surface).map((surface) => {
    if (surface.bg === undefined) throw new Error(`Missing ${theme.name} surface background`);
    return surface.bg;
  });
}

function minRoleDistance(theme: Theme): number {
  const labs = SEMANTIC_ROLES.map((role) => rgbToOklab(hexToRgb(theme.semantic[role].hex)));
  let minimum = Number.POSITIVE_INFINITY;
  for (let left = 0; left < labs.length; left++) {
    for (let right = left + 1; right < labs.length; right++) {
      const a = labs[left];
      const b = labs[right];
      if (a !== undefined && b !== undefined) minimum = Math.min(minimum, deltaEOk(a, b));
    }
  }
  return minimum;
}

describe.each([BIJOU_DARK, BIJOU_LIGHT])('$name Sapphire Noir behavior', (theme) => {
  it('keeps every semantic role readable on every first-party surface', () => {
    for (const role of ['primary', 'muted', ...SEMANTIC_ROLES] as const) {
      for (const bg of backgrounds(theme)) {
        expect(themeContrastRatio(theme.semantic[role].hex, bg), `${role} on ${bg}`)
          .toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('separates interactive emphasis from semantic status', () => {
    expect(theme.semantic.accent.hex).not.toBe(theme.semantic.warning.hex);
    expect(theme.semantic.accent.hex).not.toBe(theme.semantic.info.hex);
    expect(minRoleDistance(theme)).toBeGreaterThan(0.055);
  });

  it('keeps every focus and status role distinct after terminal downsampling', () => {
    const ansi256 = SEMANTIC_ROLES.map((role) => (
      rgbToAnsi256(...hexToRgb(theme.semantic[role].hex))
    ));
    const ansi16 = SEMANTIC_ROLES.map((role) => (
      rgbToAnsi16(...hexToRgb(theme.semantic[role].hex))
    ));
    expect(new Set(ansi256).size).toBe(SEMANTIC_ROLES.length);
    expect(new Set(ansi16).size).toBe(SEMANTIC_ROLES.length);
  });
});

describe('Sapphire Noir character', () => {
  it('uses sapphire for focus instead of warning gold', () => {
    for (const theme of [BIJOU_DARK, BIJOU_LIGHT]) {
      const accent = rgbToOklch(hexToRgb(theme.semantic.accent.hex));
      const hueDistance = Math.min(Math.abs(accent.h - 255), 360 - Math.abs(accent.h - 255));
      expect(hueDistance).toBeLessThan(2);
    }
  });

  it('uses low-chroma ice rather than parchment for dark body text', () => {
    expect(rgbToOklch(hexToRgb(BIJOU_DARK.semantic.primary.hex)).c).toBeLessThan(0.03);
  });

  it('does not collapse light informational status onto brand chrome', () => {
    expect(BIJOU_LIGHT.semantic.info.hex).not.toBe(BIJOU_LIGHT.border.primary.hex);
    const info = hexToRgb(BIJOU_LIGHT.semantic.info.hex);
    const brand = hexToRgb(BIJOU_LIGHT.border.primary.hex);
    expect(rgbToAnsi256(...info)).not.toBe(rgbToAnsi256(...brand));
    expect(rgbToAnsi16(...info)).not.toBe(rgbToAnsi16(...brand));
  });
});
