import {
  _registerDefaultContextInitializerForTesting,
  _resetDefaultContextForTesting,
  _resetInitializedForTesting,
  afterEach,
  beforeEach,
  createTestContext,
  describe,
  expect,
  getDefaultContext,
  initDefaultContext,
  it,
  run,
  setDefaultContext,
  startApp,
  textSurface,
  vi,
} from './index.test-support.js';

import type { App, RunOptions } from './index.test-support.js';

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

  it('uses an explicit ctx without overwriting the existing default context', async () => {
    vi.stubEnv('TERM', 'dumb');
    const defaultCtx = initDefaultContext();
    const explicitCtx = createTestContext({ mode: 'pipe', runtime: { columns: 40, rows: 10 } });

    await startApp({
      init: () => [0, []],
      update: (_msg, model) => [model, []],
      view: () => textSurface('explicit ctx path'),
    }, { ctx: explicitCtx });

    expect(getDefaultContext()).toBe(defaultCtx);
    expect(explicitCtx.io.written).toEqual(['explicit ctx path']);
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

  it('lets run() resolve the Node default context without a manual init step', async () => {
    vi.stubEnv('TERM', 'dumb');
    const ctx = createTestContext({ mode: 'pipe', runtime: { columns: 40, rows: 10 } });
    setDefaultContext(ctx);

    await run({
      init: () => [0, []],
      update: (_msg, model) => [model, []],
      view: () => textSurface('hello from ambient run'),
    });

    expect(getDefaultContext()).toBe(ctx);
    expect(ctx.io.written).toEqual(['hello from ambient run']);
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

  it('delegates to self-running framed apps instead of bypassing their hosted runner', async () => {
    const ctx = createTestContext({ mode: 'pipe', runtime: { columns: 40, rows: 10 } });
    let received: RunOptions | undefined;
    const app: App<number> & { run(options?: RunOptions): Promise<void> } = {
      init: () => [0, []],
      update: (_msg, model) => [model, []],
      view: () => textSurface('bypassed view'),
      run(options?: RunOptions): Promise<void> {
        received = options;
        options?.ctx?.io.write('framed through startApp');
        return Promise.resolve();
      },
    };

    await startApp(app, { ctx });

    expect(received).toEqual({ ctx });
    expect(ctx.io.written.some((chunk) => chunk.includes('framed through startApp'))).toBe(true);
  });
});
