import { describe, expect, it } from 'vitest';
import { defineThemeSafePairs, doctorTheme, themeContrastRatio } from './doctor.js';
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

  it('validates safe pairs against background color slots', () => {
    const pairs = defineThemeSafePairs()
      .readable('semantic.primary', 'surface.primary.bg', { label: 'body copy' })
      .status('status.error', 'surface.overlay.bg')
      .build();

    const report = doctorTheme(CYAN_MAGENTA, { contrastPairs: pairs });

    expect(pairs).toEqual([
      {
        kind: 'readable',
        foreground: 'semantic.primary',
        background: 'surface.primary.bg',
        label: 'body copy',
      },
      {
        kind: 'status',
        foreground: 'status.error',
        background: 'surface.overlay.bg',
      },
    ]);
    expect(report.issues.filter((issue) => issue.kind === 'missing-token')).toEqual([]);
  });

  it('rejects duplicate safe-pair declarations', () => {
    expect(() => defineThemeSafePairs()
      .readable('semantic.primary', 'surface.primary.bg')
      .readable('semantic.primary', 'surface.primary.bg')
      .build()).toThrow('Duplicate theme safe pair semantic.primary on surface.primary.bg.');
  });
});
