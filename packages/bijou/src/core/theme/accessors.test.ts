import { describe, it, expect } from 'vitest';
import { createThemeAccessors } from './accessors.js';
import { createResolved } from './resolve.js';
import { CYAN_MAGENTA } from './presets.js';

describe('createThemeAccessors()', () => {
  const theme = createResolved(CYAN_MAGENTA, false);
  const acc = createThemeAccessors(theme);

  it('semantic() returns matching token', () => {
    expect(acc.semantic('primary').hex).toBe(theme.theme.semantic.primary.hex);
    expect(acc.semantic('primary').fgRGB).toEqual(theme.theme.semantic.primary.fgRGB);
  });

  it('border() returns matching token', () => {
    expect(acc.border('primary').hex).toBe(theme.theme.border.primary.hex);
    expect(acc.border('primary').fgRGB).toEqual(theme.theme.border.primary.fgRGB);
  });

  it('surface() returns matching token', () => {
    expect(acc.surface('primary').hex).toBe(theme.theme.surface.primary.hex);
    expect(acc.surface('primary').fgRGB).toEqual(theme.theme.surface.primary.fgRGB);
    expect(acc.surface('primary').bgRGB).toEqual(theme.theme.surface.primary.bgRGB);
  });

  it('status() returns matching token', () => {
    expect(acc.status('muted').hex).toBe(
      (theme.theme.status as Record<string, { hex: string }>)['muted']!.hex,
    );
    expect(acc.status('muted').fgRGB).toEqual(
      (theme.theme.status as Record<string, { fgRGB?: [number, number, number] }>)['muted']!.fgRGB,
    );
  });

  it('status() falls back to muted for unknown keys', () => {
    const muted = acc.status('muted');
    expect(acc.status('nonexistent').hex).toBe(muted.hex);
  });

  it('ui() falls back to semantic.primary for unknown keys', () => {
    expect(acc.ui('nonexistent').hex).toBe(theme.theme.semantic.primary.hex);
  });

  it('gradient() returns empty array for unknown keys', () => {
    expect(acc.gradient('nonexistent')).toEqual([]);
  });
});
