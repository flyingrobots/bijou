import { afterEach, describe, expect, it } from 'vitest';
import { colorHex, themeContrastRatio } from '@flyingrobots/bijou';
import { createTestContext, _resetDefaultContextForTesting } from '@flyingrobots/bijou/adapters/test';
import { normalizeViewOutput } from '../scripts/docs-preview.test-support.js';
import { createDocsApp } from '../examples/docs/app-root.js';
import { DOGFOOD_SHELL_THEMES } from '../examples/docs/dogfood-shell-themes.js';

function bookTheme(mode: 'dark' | 'light') {
  const spec = DOGFOOD_SHELL_THEMES.find((entry) => entry.id === 'book');
  if (spec === undefined || spec.theme !== undefined) throw new Error('Book theme pair is missing.');
  const selected = spec.modes.find((entry) => entry.id === mode);
  if (selected === undefined) throw new Error('Book mode is missing.');
  return selected.theme;
}

afterEach(() => { _resetDefaultContextForTesting(); });

describe('book theme pair', () => {
  it('registers both book modes before the preserved neutral theme', () => {
    expect(DOGFOOD_SHELL_THEMES[0]?.id).toBe('book');
    expect(DOGFOOD_SHELL_THEMES.some((theme) => theme.id === 'dogfood')).toBe(true);
    expect(bookTheme('dark').semantic.accent.hex).toBe('#f7685f');
    expect(bookTheme('light').semantic.accent.hex).toBe('#83312c');
    expect(bookTheme('light').surface.secondary.bg).toBe('#ffedeb');
  });

  it.each(['dark', 'light'] as const)('keeps essential text and chrome readable across %s surfaces', (mode) => {
    const theme = bookTheme(mode);
    for (const surface of Object.values(theme.surface)) {
      if (surface.bg === undefined) throw new Error('A book surface lost its background.');
      for (const token of Object.values(theme.semantic)) {
        expect(themeContrastRatio(token.hex, surface.bg) ?? 0).toBeGreaterThanOrEqual(4.5);
      }
      for (const token of [theme.border.primary, theme.border.muted, theme.ui.scrollTrack]) {
        expect(themeContrastRatio(token.hex, surface.bg) ?? 0).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('uses book colors on the real landing surface and invalidates the mode cache', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 100, rows: 40 } });
    const app = createDocsApp(ctx);
    const [initial] = app.init();
    expect(initial.docsModel.activeShellThemeId).toBe('book:dark');
    const dark = normalizeViewOutput(app.view(initial), { width: 100, height: 40 }).surface;
    const light = normalizeViewOutput(app.view({
      ...initial,
      docsModel: { ...initial.docsModel, activeShellThemeId: 'book:light' },
    }), { width: 100, height: 40 }).surface;
    expect(colorHex(dark.get(0, 39).bg)).toBe(bookTheme('dark').surface.primary.bg);
    expect(colorHex(light.get(0, 39).bg)).toBe(bookTheme('light').surface.primary.bg);
    expect(colorHex(light.get(0, 39).bg)).not.toBe(colorHex(dark.get(0, 39).bg));
  });
});
