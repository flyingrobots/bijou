import { describe, it, expect, vi } from 'vitest';
import {
  isNoColor,
  createThemeResolver,
  createResolved,
} from './resolve.js';
import { CYAN_MAGENTA } from './presets.js';
import { mockRuntime } from '../../adapters/test/runtime.js';

describe('isNoColor', () => {
  it('returns true when NO_COLOR is set', () => {
    const rt = mockRuntime({ env: { NO_COLOR: '' } });
    expect(isNoColor(rt)).toBe(true);
  });

  it('returns true when NO_COLOR is any value', () => {
    const rt = mockRuntime({ env: { NO_COLOR: '1' } });
    expect(isNoColor(rt)).toBe(true);
  });

  it('returns false when NO_COLOR is unset', () => {
    const rt = mockRuntime({});
    expect(isNoColor(rt)).toBe(false);
  });
});

describe('createThemeResolver', () => {
  it('defaults to cyan-magenta theme', () => {
    const rt = mockRuntime({});
    const resolver = createThemeResolver({ runtime: rt });
    const t = resolver.getTheme();
    expect(t.theme.name).toBe('cyan-magenta');
    expect(t.noColor).toBe(false);
  });

  it('selects teal-orange-pink via BIJOU_THEME', () => {
    const rt = mockRuntime({ env: { BIJOU_THEME: 'teal-orange-pink' } });
    const resolver = createThemeResolver({ runtime: rt });
    const t = resolver.getTheme();
    expect(t.theme.name).toBe('teal-orange-pink');
  });

  it('falls back to cyan-magenta for unknown theme name', () => {
    const rt = mockRuntime({ env: { BIJOU_THEME: 'nonexistent-theme' } });
    const resolver = createThemeResolver({ runtime: rt });
    const t = resolver.getTheme();
    expect(t.theme.name).toBe('cyan-magenta');
  });

  it('caches the theme singleton', () => {
    const rt = mockRuntime({});
    const resolver = createThemeResolver({ runtime: rt });
    const t1 = resolver.getTheme();
    const t2 = resolver.getTheme();
    expect(t1).toBe(t2);
  });

  it('_resetForTesting clears the cache', () => {
    const rt = mockRuntime({});
    const resolver = createThemeResolver({ runtime: rt });
    const t1 = resolver.getTheme();
    resolver._resetForTesting();
    const t2 = resolver.getTheme();
    expect(t1).not.toBe(t2);
    expect(t1.theme.name).toBe(t2.theme.name);
  });

  it('resolveTheme bypasses the cache', () => {
    const rt = mockRuntime({});
    const resolver = createThemeResolver({ runtime: rt });
    const t1 = resolver.resolveTheme('teal-orange-pink');
    const t2 = resolver.resolveTheme('teal-orange-pink');
    expect(t1).not.toBe(t2);
    expect(t1.theme.name).toBe('teal-orange-pink');
  });

  it('uses custom env var', () => {
    const rt = mockRuntime({ env: { MY_THEME: 'teal-orange-pink' } });
    const resolver = createThemeResolver({ envVar: 'MY_THEME', runtime: rt });
    const t = resolver.getTheme();
    expect(t.theme.name).toBe('teal-orange-pink');
  });

  it('uses custom fallback', async () => {
    const { TEAL_ORANGE_PINK } = await import('./presets.js');
    const rt = mockRuntime({});
    const resolver = createThemeResolver({ fallback: TEAL_ORANGE_PINK, runtime: rt });
    const t = resolver.getTheme();
    expect(t.theme.name).toBe('teal-orange-pink');
  });

  it('supports custom preset registry', () => {
    const custom = { name: 'custom', status: {}, semantic: {}, gradient: {}, border: {}, ui: {} };
    const rt = mockRuntime({});
    const resolver = createThemeResolver({
      presets: { 'custom': custom as never },
      envVar: 'CUSTOM_THEME',
      fallback: custom as never,
      runtime: rt,
    });
    const t = resolver.getTheme();
    expect(t.theme.name).toBe('custom');
  });

  it('writes warnings through warningPort for unknown env theme', () => {
    const rt = mockRuntime({ env: { BIJOU_THEME: 'missing-theme' } });
    const writeError = vi.fn();
    const resolver = createThemeResolver({
      runtime: rt,
      warningPort: { writeError },
    });

    const t = resolver.getTheme();
    expect(t.theme.name).toBe('cyan-magenta');
    expect(writeError).toHaveBeenCalledTimes(1);
    expect(writeError).toHaveBeenCalledWith(
      '[bijou] Unknown BIJOU_THEME="missing-theme", falling back to "cyan-magenta".\n',
    );
  });

  it('writes warnings through warningPort for unknown explicit name', () => {
    const rt = mockRuntime({});
    const writeError = vi.fn();
    const resolver = createThemeResolver({
      runtime: rt,
      warningPort: { writeError },
    });

    const t = resolver.resolveTheme('missing-theme');
    expect(t.theme.name).toBe('cyan-magenta');
    expect(writeError).toHaveBeenCalledTimes(1);
    expect(writeError).toHaveBeenCalledWith(
      '[bijou] Unknown theme "missing-theme", falling back to "cyan-magenta".\n',
    );
  });

  describe('NO_COLOR', () => {
    it('ink() returns undefined when NO_COLOR is set', () => {
      const rt = mockRuntime({ env: { NO_COLOR: '1' } });
      const resolver = createThemeResolver({ runtime: rt });
      const t = resolver.getTheme();
      expect(t.ink(t.theme.semantic.success)).toBeUndefined();
    });

    it('ink() returns hex when NO_COLOR is unset', () => {
      const rt = mockRuntime({});
      const resolver = createThemeResolver({ runtime: rt });
      const t = resolver.getTheme();
      expect(t.ink(t.theme.semantic.success)).toBe(t.theme.semantic.success.hex);
    });

    it('inkStatus() returns undefined when NO_COLOR is set', () => {
      const rt = mockRuntime({ env: { NO_COLOR: '1' } });
      const resolver = createThemeResolver({ runtime: rt });
      const t = resolver.getTheme();
      expect(t.inkStatus('success')).toBeUndefined();
    });

    it('inkStatus() falls back to muted hex for unknown status', () => {
      const rt = mockRuntime({});
      const resolver = createThemeResolver({ runtime: rt });
      const t = resolver.getTheme();
      const result = t.inkStatus('NONEXISTENT_STATUS');
      expect(result).toBe(t.theme.status.muted.hex);
    });
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
