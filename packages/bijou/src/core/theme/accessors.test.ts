import { describe, it, expect } from 'vitest';
import { createThemeAccessors } from './accessors.js';
import { createResolved } from './resolve.js';
import { CYAN_MAGENTA } from './presets.js';
import { must } from '@flyingrobots/bijou/adapters/test';

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
      must((theme.theme.status as Record<string, { hex: string }>)['muted']).hex,
    );
    expect(acc.status('muted').fgRGB).toEqual(
      must((theme.theme.status as Record<string, { fgRGB?: [number, number, number] }>)['muted']).fgRGB,
    );
  });

  // The fallback target is `semantic.muted`, not `status.muted`. Both carry the
  // same hex in every shipped preset, so the observable difference is entirely in
  // the modifiers: `status.muted` adds `strikethrough`, which reads as
  // "cancelled" and is the wrong thing to say about a key nobody defined.
  it('status() falls back to semantic.muted for unknown keys', () => {
    const fallback = acc.status('nonexistent');
    expect(fallback.hex).toBe(theme.theme.semantic.muted.hex);
    expect(fallback.modifiers ?? []).toEqual(theme.theme.semantic.muted.modifiers ?? []);
  });

  it('status() never returns a struck-through token for an unknown key', () => {
    expect(acc.status('nonexistent').modifiers ?? []).not.toContain('strikethrough');
  });

  it('status(\'muted\') still returns the real muted token, strikethrough intact', () => {
    // The token itself is unchanged; only what an unknown key resolves to moved.
    const muted = acc.status('muted');
    expect(muted.modifiers ?? []).toContain('strikethrough');
  });

  it('ui() falls back to semantic.primary for unknown keys', () => {
    expect(acc.ui('nonexistent').hex).toBe(theme.theme.semantic.primary.hex);
  });

  it('gradient() returns empty array for unknown keys', () => {
    expect(acc.gradient('nonexistent')).toEqual([]);
  });
});
