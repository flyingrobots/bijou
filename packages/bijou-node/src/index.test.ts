import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import {
  createNodeContext,
  initDefaultContext,
  startApp,
  _resetInitializedForTesting,
  _registerDefaultContextInitializerForTesting,
} from './index.js';
import { getDefaultContext, stringToSurface, type Surface } from '@flyingrobots/bijou';
import { _resetDefaultContextForTesting, createTestContext } from '@flyingrobots/bijou/adapters/test';
import { createFramedApp, run } from '@flyingrobots/bijou-tui';

function textSurface(text: string): Surface {
  const lines = text.split('\n');
  return stringToSurface(text, Math.max(1, ...lines.map((line) => line.length)), Math.max(1, lines.length));
}

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
});

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
    const spy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);

    await startApp({
      init: () => [0, []],
      update: (_msg, model) => [model, []],
      view: () => textSurface('hello from startApp'),
    });

    expect(getDefaultContext()).toBeDefined();
    expect(spy).toHaveBeenCalledWith('hello from startApp');
    spy.mockRestore();
  });

  it('uses an explicit ctx without overwriting the existing default context', async () => {
    vi.stubEnv('TERM', 'dumb');
    const defaultCtx = initDefaultContext();
    const explicitCtx = createTestContext({ mode: 'pipe', runtime: { columns: 40, rows: 10 } });
    const writeSpy = vi.spyOn(explicitCtx.io, 'write');

    await startApp({
      init: () => [0, []],
      update: (_msg, model) => [model, []],
      view: () => textSurface('explicit ctx path'),
    }, { ctx: explicitCtx });

    expect(getDefaultContext()).toBe(defaultCtx);
    expect(writeSpy).toHaveBeenCalledWith('explicit ctx path');
  });

  it('lets run() resolve the Node default context without a manual init step', async () => {
    vi.stubEnv('TERM', 'dumb');
    const spy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);

    await run({
      init: () => [0, []],
      update: (_msg, model) => [model, []],
      view: () => textSurface('hello from ambient run'),
    });

    expect(getDefaultContext()).toBeDefined();
    expect(spy).toHaveBeenCalledWith('hello from ambient run');
    spy.mockRestore();
  });

  it('delegates to self-running framed apps instead of bypassing their hosted runner', async () => {
    const ctx = createTestContext({ mode: 'pipe', runtime: { columns: 40, rows: 10 } });
    const app = createFramedApp({
      pages: [{
        id: 'home',
        title: 'Home',
        init: () => [{ count: 0 }, []],
        update: (_msg, model) => [model, []],
        layout: () => ({
          kind: 'pane',
          paneId: 'main',
          render: () => textSurface('framed through startApp'),
        }),
      }],
    });
    const runSpy = vi.spyOn(app, 'run');

    await startApp(app, { ctx });

    expect(runSpy).toHaveBeenCalledWith({ ctx });
    expect(ctx.io.written.some((chunk) => chunk.includes('framed through startApp'))).toBe(true);
  });
});
