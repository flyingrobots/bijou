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
    expect(ctx?.runtime).toBe(handle.ctx.runtime);
    expect(ctx?.mode).toBe('interactive');
    expect([ctx?.runtime.columns, ctx?.runtime.rows]).toEqual([80, 24]);
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
