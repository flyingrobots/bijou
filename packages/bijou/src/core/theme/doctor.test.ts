import { describe, expect, it } from 'vitest';
import { doctorTheme, themeContrastRatio } from './doctor.js';
import { CYAN_MAGENTA } from './presets.js';
import type { Theme } from './tokens.js';

describe('theme contrast doctor', () => {
  it('calculates deterministic contrast ratios', () => {
    expect(themeContrastRatio('#000000', '#ffffff')).toBe(21);
    expect(themeContrastRatio('#777777', '#777777')).toBe(1);
    expect(themeContrastRatio('invalid', '#ffffff')).toBeUndefined();
  });

  it('reports invalid colors, low contrast pairs, and suspicious color reuse', () => {
    const theme: Theme = {
      ...CYAN_MAGENTA,
      name: 'doctor-test',
      semantic: {
        ...CYAN_MAGENTA.semantic,
        primary: { hex: '#222222' },
        accent: { hex: '#222222', bg: 'not-a-color' },
      },
      border: {
        ...CYAN_MAGENTA.border,
        primary: { hex: 'also-not-a-color' },
      },
      surface: {
        ...CYAN_MAGENTA.surface,
        primary: { hex: '#111111' },
        secondary: { hex: '#222222' },
      },
    };

    const report = doctorTheme(theme, {
      contrastPairs: [
        {
          foreground: 'semantic.primary',
          background: 'surface.primary',
          minRatio: 4.5,
        },
      ],
      maxColorReuse: 2,
    });

    expect(report.passed).toBe(false);
    expect(report.themeName).toBe('doctor-test');
    expect(report.checkedTokenCount).toBeGreaterThan(0);
    expect(report.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'invalid-color',
        severity: 'error',
        path: 'semantic.accent.bg',
        color: 'not-a-color',
      }),
      expect.objectContaining({
        kind: 'invalid-color',
        severity: 'error',
        path: 'border.primary',
        color: 'also-not-a-color',
      }),
      expect.objectContaining({
        kind: 'low-contrast',
        severity: 'warning',
        foregroundPath: 'semantic.primary',
        backgroundPath: 'surface.primary',
        ratio: 1.19,
        minRatio: 4.5,
      }),
      expect.objectContaining({
        kind: 'color-reuse',
        severity: 'warning',
        color: '#222222',
        limit: 2,
      }),
    ]));
  });
});
