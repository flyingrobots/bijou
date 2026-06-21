
import {
  _registerDefaultContextInitializerForTesting,
  _resetDefaultContextForTesting,
  _resetInitializedForTesting,
  afterEach,
  beforeEach,
  BijouBootstrapError,
  createTestContext,
  describe,
  expect,
  getDefaultContext,
  initDefaultContext,
  it,
  LEGACY_TEST_THEME,
  setDefaultContext,
  startApp,
  TEST_THEME_SET,
  textSurface,
  vi,
  withStdoutSize,
} from './index.test-support.js';

describe('initDefaultContext()', () => {
  beforeEach(() => {
    _resetInitializedForTesting();
    _resetDefaultContextForTesting();
    _registerDefaultContextInitializerForTesting();
  });

  afterEach(() => {
    _resetInitializedForTesting();
    _resetDefaultContextForTesting();
    _registerDefaultContextInitializerForTesting();
  });

  it('first call returns a BijouContext with all five fields', () => {
    const ctx = initDefaultContext();
    expect(ctx.theme).toBeDefined();
    expect(ctx.mode).toBeDefined();
    expect(ctx.runtime).toBeDefined();
    expect(ctx.io).toBeDefined();
    expect(ctx.style).toBeDefined();
  });

  it('first call sets the default context', () => {
    const ctx = initDefaultContext();
    expect(getDefaultContext()).toBe(ctx);
  });

  it('subsequent call returns a new context without overwriting the default', () => {
    const first = initDefaultContext();
    const second = initDefaultContext();
    expect(second).not.toBe(first);
    expect(getDefaultContext()).toBe(first);
  });

  it('registers an explicit theme override as the default on first call', () => {
    const ctx = initDefaultContext({ theme: LEGACY_TEST_THEME });
    expect(ctx.theme.theme.name).toBe('test-theme');
    expect(getDefaultContext()).toBe(ctx);
  });

  it('registers the auto-selected theme from a theme set on first call', () => {
    vi.stubEnv('COLORFGBG', '0;15');
    const ctx = initDefaultContext({ themes: TEST_THEME_SET, themeMode: 'auto' });
    expect(ctx.theme.theme.name).toBe('light-theme');
    expect(ctx.theme.colorScheme).toBe('light');
    expect(getDefaultContext()).toBe(ctx);
  });

  it('throws a structured bootstrap error when stdout reports unusable dimensions', () => {
    withStdoutSize(0, 24, () => {
      expect(() => initDefaultContext()).toThrow(BijouBootstrapError);
      try {
        initDefaultContext();
      } catch (error) {
        if (!(error instanceof BijouBootstrapError)) throw error;
        expect(error.name).toBe('BijouBootstrapError');
        expect(error.reason).toBe('stdout reported zero columns/rows');
        expect(error.hint).toContain('use pipe mode');
        expect(error.message).toBe('initDefaultContext failed: stdout reported zero columns/rows');
      }
    });
  });
});

describe('BijouBootstrapError', () => {
  it('preserves reason, hint, and cause for callers that recover startup failures', () => {
    const cause = new Error('raw mode failed');
    const error = new BijouBootstrapError('raw mode unavailable', 'run in an interactive terminal', cause);

    expect(error.name).toBe('BijouBootstrapError');
    expect(error.message).toBe('initDefaultContext failed: raw mode unavailable');
    expect(error.reason).toBe('raw mode unavailable');
    expect(error.hint).toBe('run in an interactive terminal');
    expect(error.cause).toBe(cause);
  });
});

describe('startApp()', () => {
beforeEach(() => {
    _resetInitializedForTesting();
    _resetDefaultContextForTesting();
    _registerDefaultContextInitializerForTesting();
    vi.unstubAllEnvs();
  });

afterEach(() => {
    _resetInitializedForTesting();
    _resetDefaultContextForTesting();
    _registerDefaultContextInitializerForTesting();
    vi.unstubAllEnvs();
  });

it('initializes the default node context automatically when ctx is omitted', async () => {
    vi.stubEnv('TERM', 'dumb');
    const ctx = createTestContext({ mode: 'pipe', runtime: { columns: 40, rows: 10 } });
    setDefaultContext(ctx);

    await startApp({
      init: () => [0, []],
      update: (_msg, model) => [model, []],
      view: () => textSurface('hello from startApp'),
    });

    expect(getDefaultContext()).toBe(ctx);
    expect(ctx.io.written).toEqual(['hello from startApp']);
  });
});
