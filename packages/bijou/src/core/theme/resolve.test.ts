import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getTheme,
  resolveTheme,
  isNoColor,
  _resetThemeForTesting,
  createThemeResolver,
  createResolved,
} from './resolve.js';
import { CYAN_MAGENTA } from './presets.js';
import { mockRuntime } from '../../adapters/test/runtime.js';

describe('resolve', () => {
  beforeEach(() => {
    _resetThemeForTesting();
    delete process.env['NO_COLOR'];
    delete process.env['BIJOU_THEME'];
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    _resetThemeForTesting();
  });

  it('defaults to cyan-magenta theme', () => {
    const t = getTheme();
    expect(t.theme.name).toBe('cyan-magenta');
    expect(t.noColor).toBe(false);
  });

  it('selects teal-orange-pink via BIJOU_THEME', () => {
    process.env['BIJOU_THEME'] = 'teal-orange-pink';
    const t = getTheme();
    expect(t.theme.name).toBe('teal-orange-pink');
  });

  it('falls back to cyan-magenta for unknown theme name', () => {
    process.env['BIJOU_THEME'] = 'nonexistent-theme';
    const t = getTheme();
    expect(t.theme.name).toBe('cyan-magenta');
  });

  it('caches the theme singleton', () => {
    const t1 = getTheme();
    const t2 = getTheme();
    expect(t1).toBe(t2);
  });

  it('_resetThemeForTesting clears the cache', () => {
    const t1 = getTheme();
    _resetThemeForTesting();
    const t2 = getTheme();
    expect(t1).not.toBe(t2);
    expect(t1.theme.name).toBe(t2.theme.name);
  });

  it('resolveTheme bypasses the cache', () => {
    const t1 = resolveTheme('teal-orange-pink');
    const t2 = resolveTheme('teal-orange-pink');
    expect(t1).not.toBe(t2);
    expect(t1.theme.name).toBe('teal-orange-pink');
  });

  describe('NO_COLOR', () => {
    it('isNoColor returns true when NO_COLOR is set', () => {
      process.env['NO_COLOR'] = '';
      expect(isNoColor()).toBe(true);
    });

    it('isNoColor returns false when NO_COLOR is unset', () => {
      delete process.env['NO_COLOR'];
      expect(isNoColor()).toBe(false);
    });

    it('ink() returns undefined when NO_COLOR is set', () => {
      process.env['NO_COLOR'] = '1';
      const t = getTheme();
      expect(t.ink(t.theme.semantic.success)).toBeUndefined();
    });

    it('ink() returns hex when NO_COLOR is unset', () => {
      const t = getTheme();
      expect(t.ink(t.theme.semantic.success)).toBe(t.theme.semantic.success.hex);
    });

    it('inkStatus() returns undefined when NO_COLOR is set', () => {
      process.env['NO_COLOR'] = '1';
      const t = getTheme();
      expect(t.inkStatus('success')).toBeUndefined();
    });

    it('inkStatus() falls back to muted hex for unknown status', () => {
      const t = getTheme();
      const result = t.inkStatus('NONEXISTENT_STATUS');
      expect(result).toBe(t.theme.status.muted.hex);
    });
  });
});

describe('createThemeResolver', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses custom env var', () => {
    process.env['MY_THEME'] = 'teal-orange-pink';
    const resolver = createThemeResolver({ envVar: 'MY_THEME' });
    const t = resolver.getTheme();
    expect(t.theme.name).toBe('teal-orange-pink');
    delete process.env['MY_THEME'];
  });

  it('uses custom fallback', async () => {
    const { TEAL_ORANGE_PINK } = await import('./presets.js');
    const resolver = createThemeResolver({ fallback: TEAL_ORANGE_PINK });
    const t = resolver.getTheme();
    expect(t.theme.name).toBe('teal-orange-pink');
  });

  it('supports custom preset registry', () => {
    const custom = { name: 'custom', status: {}, semantic: {}, gradient: {}, border: {}, ui: {} };
    const resolver = createThemeResolver({
      presets: { 'custom': custom as never },
      envVar: 'CUSTOM_THEME',
      fallback: custom as never,
    });
    const t = resolver.getTheme();
    expect(t.theme.name).toBe('custom');
  });

  it('writes warnings through warningPort for unknown env theme', () => {
    process.env['BIJOU_THEME'] = 'missing-theme';
    const writeError = vi.fn();
    const resolver = createThemeResolver({
      warningPort: { writeError },
    });

    const t = resolver.getTheme();
    expect(t.theme.name).toBe('cyan-magenta');
    expect(writeError).toHaveBeenCalledWith(
      '[bijou] Unknown BIJOU_THEME="missing-theme", falling back to "cyan-magenta".\n',
    );
    delete process.env['BIJOU_THEME'];
  });

  it('writes warnings through warningPort for unknown explicit name', () => {
    const writeError = vi.fn();
    const resolver = createThemeResolver({
      warningPort: { writeError },
    });

    const t = resolver.resolveTheme('missing-theme');
    expect(t.theme.name).toBe('cyan-magenta');
    expect(writeError).toHaveBeenCalledWith(
      '[bijou] Unknown theme "missing-theme", falling back to "cyan-magenta".\n',
    );
  });

  it('caches per-resolver', () => {
    const resolver = createThemeResolver();
    const t1 = resolver.getTheme();
    const t2 = resolver.getTheme();
    expect(t1).toBe(t2);
  });

  it('_resetForTesting clears per-resolver cache', () => {
    const resolver = createThemeResolver();
    const t1 = resolver.getTheme();
    resolver._resetForTesting();
    const t2 = resolver.getTheme();
    expect(t1).not.toBe(t2);
  });
});

describe('colorScheme', () => {
  it('createResolved() defaults colorScheme to dark', () => {
    const t = createResolved(CYAN_MAGENTA, false);
    expect(t.colorScheme).toBe('dark');
  });

  it('createResolved() accepts explicit light colorScheme', () => {
    const t = createResolved(CYAN_MAGENTA, false, 'light');
    expect(t.colorScheme).toBe('light');
  });

  it('createThemeResolver() detects light from COLORFGBG', () => {
    const rt = mockRuntime({ env: { COLORFGBG: '0;15' } });
    const resolver = createThemeResolver({ runtime: rt });
    const t = resolver.getTheme();
    expect(t.colorScheme).toBe('light');
  });

  it('createThemeResolver() defaults to dark without COLORFGBG', () => {
    const rt = mockRuntime({});
    const resolver = createThemeResolver({ runtime: rt });
    const t = resolver.getTheme();
    expect(t.colorScheme).toBe('dark');
  });

  it('resolveTheme() detects colorScheme from runtime', () => {
    const rt = mockRuntime({ env: { COLORFGBG: '0;15' } });
    const resolver = createThemeResolver({ runtime: rt });
    const t = resolver.resolveTheme();
    expect(t.colorScheme).toBe('light');
  });
});
