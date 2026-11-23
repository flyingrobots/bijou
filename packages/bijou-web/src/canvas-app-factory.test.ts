import { describe, expect, it } from 'vitest';
import { stringToSurface, type BijouContext } from '@flyingrobots/bijou';
import type { App } from '@flyingrobots/bijou-tui';
import { mountBijouCanvas } from './index.js';
import { counterApp, createCanvasEnv, type CounterModel } from './canvas-env.test-support.js';

/** An app built from the context it runs with, as example apps that take a `ctx` are. */
function sizedApp(received: BijouContext[]): (ctx: BijouContext) => App<CounterModel> {
  return (ctx) => {
    received.push(ctx);
    return { ...counterApp, view: () => stringToSurface(`${String(ctx.runtime.columns)}x${String(ctx.runtime.rows)}`, 12, 1) };
  };
}

describe('mountBijouCanvas() app factory and run options', () => {
  it('builds the app once from a factory that receives the run context at the mounted grid', async () => {
    const env = createCanvasEnv();
    const received: BijouContext[] = [];
    const mounting = mountBijouCanvas(sizedApp(received), env.container, env.options());
    env.host.box(800, 480);
    const handle = await mounting;
    await env.drive();
    expect(received).toHaveLength(1);
    const [ctx] = received;
    expect(ctx?.mode).toBe('interactive');
    expect(ctx?.theme).toBe(handle.ctx.theme);
    expect([ctx?.runtime.columns, ctx?.runtime.rows]).toEqual([80, 24]);
    // It is the run's live context: a new container box reaches its runtime.
    env.host.box(1000, 600);
    await env.drive();
    expect([ctx?.runtime.columns, ctx?.runtime.rows]).toEqual([100, 30]);
    env.press('a');
    await env.drive();
    expect(handle.model()).toEqual({ count: 1 });
    await env.stop(handle);
  });

  it('builds the app from the factory in a lowered mode too', async () => {
    const env = createCanvasEnv();
    const received: BijouContext[] = [];
    const written: string[] = [];
    const handle = await mountBijouCanvas(sizedApp(received), env.container, env.options({
      mode: 'static',
      context: { output: { write: (text) => { written.push(text); } } },
    }));
    await handle.done;
    expect(received.map((ctx) => ctx.mode)).toEqual(['static']);
    expect(written.join('')).toContain('80x24');
  });

  it('passes css to the run, which installs a BCSS resolver on the run context', async () => {
    const env = createCanvasEnv();
    const received: BijouContext[] = [];
    const mounting = mountBijouCanvas(sizedApp(received), env.container, env.options({ css: 'Badge { color: red; }' }));
    env.host.box(800, 480);
    const handle = await mounting;
    await env.drive();
    expect(typeof received[0]?.resolveBCSS).toBe('function');
    await env.stop(handle);
  });
});

describe('mountBijouCanvas() app factory failures and early subscriptions', () => {
  it('keeps an io.onData() subscription the factory makes, and sends it the stop message', async () => {
    const env = createCanvasEnv();
    const payloads: unknown[] = [];
    const mounting = mountBijouCanvas((ctx: BijouContext) => {
      if (ctx.io.onData === undefined) throw new Error('the run context has no onData');
      ctx.io.onData((payload) => { payloads.push(payload); });
      return counterApp;
    }, env.container, env.options());
    env.host.box(800, 480);
    const handle = await mounting;
    await env.drive();
    expect(payloads).toEqual([]);
    await env.stop(handle);
    expect(payloads).toHaveLength(1);
  });

  it('releases the canvas, presenter, observers, listeners and timers when the factory throws', async () => {
    const env = createCanvasEnv();
    const failure = new Error('the app could not be built');
    const mounting = mountBijouCanvas(() => { throw failure; }, env.container, env.options());
    env.host.box(800, 480);
    await expect(mounting).rejects.toBe(failure);
    await env.drive();
    expect(env.container.children).toEqual([]);
    expect(env.backends.live()).toBe(0);
    expect(env.listeners()).toBe(0);
    expect(env.host.liveObservers()).toBe(0);
    expect(env.host.liveDprWatchers()).toBe(0);
    expect(env.clockHost.liveTimers()).toBe(0);
    expect(env.clockHost.liveFrames()).toBe(0);
    expect(env.clock.pendingHandles()).toBe(0);
  });
});
