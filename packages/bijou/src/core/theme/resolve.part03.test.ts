import { describe, it, expect } from 'vitest';
import { createThemeResolver, createResolved } from './resolve.js';
import { CYAN_MAGENTA } from './presets.js';
import { mockRuntime } from '../../adapters/test/runtime.js';

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
