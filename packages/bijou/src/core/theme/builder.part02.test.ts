import { describe, expect, it } from 'vitest';
import { defineTheme, isTokenRef, resolveThemeColorRef, tokenRef } from './builder.js';
import { defineTheme as publicDefineTheme, resolveThemeColorRef as publicResolveThemeColorRef, tokenRef as publicTokenRef } from '../../index.js';

function exampleTheme() {
  return defineTheme()
    .id('bijou.test')
    .label('Bijou Test')
    .mode('dark', mode => mode
      .token('color.status.danger.bg')
      .color({ r: 16, g: 32, b: 48 })
      .token('color.status.danger.fg')
      .color('#ffeeaa'))
    .mode('light', mode => mode
      .token('color.status.danger.bg')
      .color([240, 232, 210])
      .token('color.status.danger.fg')
      .color('#7a0011'))
    .build();
}

describe('theme builder API', () => {
  it('creates token refs and resolves them through the selected theme mode', () => {
      const theme = exampleTheme();
      const ref = tokenRef('color.status.danger.bg');

      expect(isTokenRef(ref)).toBe(true);

      const dark = resolveThemeColorRef(ref, { theme, mode: 'dark' });
      expect(dark).toEqual({
        source: 'theme',
        themeId: 'bijou.test',
        mode: 'dark',
        tokenId: 'color.status.danger.bg',
        hex: '#102030',
        rgb: [16, 32, 48],
        fallback: false,
      });

      const light = resolveThemeColorRef(ref, { theme, mode: 'light' });
      expect(light.hex).toBe('#f0e8d2');
      expect(light.rgb).toEqual([240, 232, 210]);
    });

  it('resolves raw colors without pretending they came from a theme token', () => {
      const resolved = resolveThemeColorRef('#abc', {
        theme: exampleTheme(),
        mode: 'dark',
      });

      expect(resolved).toEqual({
        source: 'raw-color',
        themeId: 'bijou.test',
        mode: 'dark',
        hex: '#aabbcc',
        rgb: [170, 187, 204],
        fallback: false,
      });
    });

  it('rejects unknown modes before resolving raw colors', () => {
      expect(() => resolveThemeColorRef('#abc', {
        theme: exampleTheme(),
        mode: 'ligth',
      })).toThrow(/Unknown theme mode "ligth" for theme "bijou\.test"/);
    });

  it('fails unresolved token refs by default and can use an explicit fallback', () => {
      const theme = exampleTheme();

      expect(() => resolveThemeColorRef(tokenRef('color.unknown'), {
        theme,
        mode: 'dark',
      })).toThrow(/Unresolved theme token "color\.unknown" for mode "dark"/);

      expect(resolveThemeColorRef(tokenRef('color.unknown'), {
        theme,
        mode: 'dark',
        unresolved: 'fallback',
        fallback: '#010203',
      })).toEqual({
        source: 'fallback',
        themeId: 'bijou.test',
        mode: 'dark',
        tokenId: 'color.unknown',
        hex: '#010203',
        rgb: [1, 2, 3],
        fallback: true,
      });
    });

  it('exports the builder API through the public package barrel', () => {
      const theme = publicDefineTheme()
        .id('bijou.public')
        .mode('dark', mode => mode.token('color.public').color('#112233'))
        .mode('light', mode => mode.token('color.public').color('#ddeeff'))
        .build();

      const resolved = publicResolveThemeColorRef(publicTokenRef('color.public'), {
        theme,
        mode: 'light',
      });

      expect(resolved.hex).toBe('#ddeeff');
    });
});
