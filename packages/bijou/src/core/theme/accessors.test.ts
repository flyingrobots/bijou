import { describe, it, expect } from 'vitest';
import { createThemeAccessors } from './accessors.js';
import { createResolved } from './resolve.js';
import { CYAN_MAGENTA } from './presets.js';

describe('createThemeAccessors()', () => {
  const theme = createResolved(CYAN_MAGENTA, false);
  const acc = createThemeAccessors(theme);

  it('semantic() returns matching token', () => {
    expect(acc.semantic('primary').hex).toBe(theme.theme.semantic.primary.hex);
  });

  it('border() returns matching token', () => {
    expect(acc.border('primary').hex).toBe(theme.theme.border.primary.hex);
  });

  it('surface() returns matching token', () => {
    expect(acc.surface('primary').hex).toBe(theme.theme.surface.primary.hex);
  });

  it('status() returns matching token', () => {
    expect(acc.status('muted').hex).toBe(
      (theme.theme.status as Record<string, { hex: string }>)['muted']!.hex,
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
