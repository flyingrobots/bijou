import {
  _registerDefaultContextInitializerForTesting,
  _resetDefaultContextForTesting,
  _resetInitializedForTesting,
  afterEach,
  beforeEach,
  createTestContext,
  describe,
  expect,
  expectTypeOf,
  getDefaultContext,
  it,
  startApp,
  TEST_THEME,
  TEST_THEME_SET,
  textSurface,
  vi,
} from './index.test-support.js';

import type { Opts, StartAppOptions } from './index.test-support.js';

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

it('creates and registers a themed default context when startApp() receives a theme override', async () => {
    vi.stubEnv('TERM', 'dumb');
    const io = createTestContext({ mode: 'pipe', runtime: { columns: 40, rows: 10 } }).io;

    await startApp({
      init: () => [0, []],
      update: (_msg, model) => [model, []],
      view: () => textSurface('hello from themed startApp'),
    }, { theme: TEST_THEME, io });

    expect(getDefaultContext().theme.theme.name).toBe('test-theme');
    expect(io.written).toEqual(['hello from themed startApp']);
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

it('creates and registers the auto-selected theme from a theme set when startApp() receives themes', async () => {
    vi.stubEnv('TERM', 'dumb');
    vi.stubEnv('COLORFGBG', '0;15');
    const io = createTestContext({ mode: 'pipe', runtime: { columns: 40, rows: 10 } }).io;

    await startApp({
      init: () => [0, []],
      update: (_msg, model) => [model, []],
      view: () => textSurface('hello from auto themed startApp'),
    }, { themes: TEST_THEME_SET, themeMode: 'auto', io });

    expect(getDefaultContext().theme.theme.name).toBe('light-theme');
    expect(getDefaultContext().theme.colorScheme).toBe('light');
    expect(io.written).toEqual(['hello from auto themed startApp']);
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

it('prefers an explicit ctx over a theme override when both are provided', async () => {
    vi.stubEnv('TERM', 'dumb');
    const explicitCtx = createTestContext({ mode: 'pipe', runtime: { columns: 40, rows: 10 } });

    await startApp({
      init: () => [0, []],
      update: (_msg, model) => [model, []],
      view: () => textSurface('explicit ctx beats theme'),
    }, { ctx: explicitCtx, theme: TEST_THEME });

    expect(getDefaultContext()).not.toBe(explicitCtx);
    expect(explicitCtx.io.written).toEqual(['explicit ctx beats theme']);
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

it('defaults StartAppOptions message payloads to unknown instead of any', () => {
    expectTypeOf<StartAppOptions>().branded.toEqualTypeOf<Opts<unknown>>();
  });
});
