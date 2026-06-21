import {
  afterEach,
  createNodeContext,
  CUSTOM_ID_THEME_SET,
  describe,
  expect,
  it,
  LEGACY_TEST_THEME,
  TEST_THEME_SET,
  UNUSED_THEME,
  vi,
} from './index.test-support.js';

describe('createNodeContext()', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns BijouContext with all five fields', () => {
    const ctx = createNodeContext();
    expect(ctx.theme).toBeDefined();
    expect(ctx.mode).toBeDefined();
    expect(ctx.runtime).toBeDefined();
    expect(ctx.io).toBeDefined();
    expect(ctx.style).toBeDefined();
  });

  it('theme is resolved with a name', () => {
    const ctx = createNodeContext();
    expect(typeof ctx.theme.theme.name).toBe('string');
    expect(typeof ctx.theme.noColor).toBe('boolean');
  });

  it('mode is a valid OutputMode', () => {
    const ctx = createNodeContext();
    expect(['interactive', 'static', 'pipe', 'accessible']).toContain(ctx.mode);
  });

  it('runtime reads process.env', () => {
    vi.stubEnv('__BIJOU_TEST_CTX__', 'test-value');
    const ctx = createNodeContext();
    expect(ctx.runtime.env('__BIJOU_TEST_CTX__')).toBe('test-value');
  });

  it('respects NO_COLOR env var', () => {
    vi.stubEnv('NO_COLOR', '1');
    const ctx = createNodeContext();
    expect(ctx.theme.noColor).toBe(true);
  });

  it('uses an explicit theme override when provided', () => {
    const ctx = createNodeContext({ theme: LEGACY_TEST_THEME });
    expect(ctx.theme.theme.name).toBe('test-theme');
    expect(ctx.theme.theme.surface.primary.bg).toBe('#0f172a');
  });

  it('selects the matching theme from a named theme set for explicit dark mode', () => {
    const ctx = createNodeContext({ themes: TEST_THEME_SET, themeMode: 'dark' });
    expect(ctx.theme.theme.name).toBe('dark-theme');
  });

  it('detects light mode automatically for a named theme set', () => {
    vi.stubEnv('COLORFGBG', '0;15');
    const ctx = createNodeContext({ themes: TEST_THEME_SET, themeMode: 'auto' });
    expect(ctx.theme.theme.name).toBe('light-theme');
    expect(ctx.theme.colorScheme).toBe('light');
  });

  it('supports custom theme ids when a scheme hint is provided', () => {
    const ctx = createNodeContext({ themes: CUSTOM_ID_THEME_SET, themeMode: 'dark' });
    expect(ctx.theme.theme.name).toBe('dark-theme');
  });

  it('lets BIJOU_THEME select a named theme from the provided set', () => {
    vi.stubEnv('BIJOU_THEME', 'light');
    const ctx = createNodeContext({ themes: TEST_THEME_SET, themeMode: 'dark' });
    expect(ctx.theme.theme.name).toBe('light-theme');
    expect(ctx.theme.colorScheme).toBe('light');
  });

  it('lets an explicit themeOverride beat BIJOU_THEME for theme sets', () => {
    vi.stubEnv('BIJOU_THEME', 'dark');
    const ctx = createNodeContext({
      themes: TEST_THEME_SET,
      themeOverride: 'light',
      themeMode: 'dark',
      theme: UNUSED_THEME,
    });
    expect(ctx.theme.theme.name).toBe('light-theme');
    expect(ctx.theme.colorScheme).toBe('light');
  });

  it('uses the explicit theme fallback when BIJOU_THEME misses, even with a theme set present', () => {
    vi.stubEnv('BIJOU_THEME', 'nonexistent');
    const ctx = createNodeContext({
      theme: UNUSED_THEME,
      themes: TEST_THEME_SET,
      themeMode: 'dark',
    });
    expect(ctx.theme.theme.name).toBe('unused-theme');
    expect(ctx.theme.colorScheme).toBe('dark');
  });
});
