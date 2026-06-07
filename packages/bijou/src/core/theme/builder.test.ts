import { describe, expect, it } from 'vitest';
import {
  defineTheme,
  isTokenRef,
  resolveThemeColorRef,
  tokenRef,
} from './builder.js';
import {
  defineTheme as publicDefineTheme,
  resolveThemeColorRef as publicResolveThemeColorRef,
  tokenRef as publicTokenRef,
} from '../../index.js';

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
  it('builds immutable token themes with required dark and light modes', () => {
    const theme = exampleTheme();

    expect(theme.id).toBe('bijou.test');
    expect(theme.label).toBe('Bijou Test');
    expect(theme.requiredModes).toEqual(['dark', 'light']);
    expect(theme.tokenIds).toEqual([
      'color.status.danger.bg',
      'color.status.danger.fg',
    ]);
    expect(theme.modes.dark.tokens['color.status.danger.bg']).toEqual({
      hex: '#102030',
      rgb: [16, 32, 48],
    });
    expect(theme.modes.light.tokens['color.status.danger.bg']).toEqual({
      hex: '#f0e8d2',
      rgb: [240, 232, 210],
    });
    expect(Object.isFrozen(theme)).toBe(true);
    expect(Object.isFrozen(theme.modes.dark.tokens)).toBe(true);
  });

  it('supports the explicit token builder variant inside a mode', () => {
    const theme = defineTheme()
      .id('bijou.variant')
      .mode('dark', mode => mode
        .token()
        .id('color.brand.primary')
        .color({ r: 1, g: 2, b: 3 })
        .register())
      .mode('light', mode => mode
        .token()
        .id('color.brand.primary')
        .color('#abcdef')
        .register())
      .build();

    expect(theme.modes.dark.tokens['color.brand.primary']).toEqual({
      hex: '#010203',
      rgb: [1, 2, 3],
    });
    expect(theme.modes.light.tokens['color.brand.primary']?.hex).toBe('#abcdef');
  });

  it('rejects duplicate token ids within one mode', () => {
    expect(() => defineTheme()
      .id('bijou.duplicate')
      .mode('dark', mode => mode
        .token('color.text.primary')
        .color('#ffffff')
        .token('color.text.primary')
        .color('#eeeeee')))
      .toThrow(/Duplicate token "color\.text\.primary" in mode "dark"/);
  });

  it('rejects themes missing required dark or light modes', () => {
    expect(() => defineTheme()
      .id('bijou.missing-light')
      .mode('dark', mode => mode
        .token('color.text.primary')
        .color('#ffffff'))
      .build())
      .toThrow(/Missing required theme mode "light"/);
  });

  it('rejects themes missing required mode values for declared tokens', () => {
    expect(() => defineTheme()
      .id('bijou.missing-token')
      .mode('dark', mode => mode
        .token('color.text.primary')
        .color('#ffffff')
        .token('color.text.muted')
        .color('#999999'))
      .mode('light', mode => mode
        .token('color.text.primary')
        .color('#000000'))
      .build())
      .toThrow(/Mode "light" is missing token "color\.text\.muted"/);
  });

  it('rejects RGB channels outside the byte range', () => {
    expect(() => defineTheme()
      .id('bijou.invalid-rgb')
      .mode('dark', mode => mode
        .token('color.invalid')
        .color({ r: 300, g: 0, b: 0 })))
      .toThrow(/RGB channels must be integers from 0 to 255/);
  });

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
