import { describe, expect, it } from 'vitest';
import { mountBijouCanvas } from './index.js';
import { counterApp, createCanvasEnv, type CanvasEnv } from './canvas-env.test-support.js';

// A canvas loses its picture when its pixel size is set. A box change smaller
// than one cell leaves the grid as it was, so the app is told nothing and
// renders nothing: the mount itself must paint the last frame again
// (flyingrobots/bijou#867).
async function mounted(env: CanvasEnv) {
  const mounting = mountBijouCanvas(counterApp, env.container, env.options());
  env.host.box(800, 480);
  const handle = await mounting;
  await env.drive();
  return handle;
}

describe('mountBijouCanvas() repaints after a resize', () => {
  it('presents the last frame again, in full, when the box changes but the grid does not', async () => {
    const env = createCanvasEnv();
    const handle = await mounted(env);
    const presenter = env.backends.created[0];
    const before = presenter?.presents.length ?? 0;
    env.host.box(805, 485);
    await env.drive();
    expect(presenter?.resizes.at(-1)).toEqual({ cssWidth: 805, cssHeight: 485, dpr: 1 });
    expect([handle.ctx.runtime.columns, handle.ctx.runtime.rows]).toEqual([80, 24]);
    expect(presenter?.presents.length).toBe(before + 1);
    expect(presenter?.presents.at(-1)).toMatchObject({ force: true, width: 80, height: 24 });
    expect(handle.model()).toEqual({ count: 0 });
    await env.stop(handle);
  });

  it('presents once for several such changes within one animation frame', async () => {
    const env = createCanvasEnv();
    const handle = await mounted(env);
    const presenter = env.backends.created[0];
    const before = presenter?.presents.length ?? 0;
    env.host.box(801, 480);
    env.host.box(803, 481);
    env.host.box(806, 483);
    await env.drive();
    expect(presenter?.resizes.at(-1)).toEqual({ cssWidth: 806, cssHeight: 483, dpr: 1 });
    expect(presenter?.presents.length).toBe(before + 1);
    expect(presenter?.presents.at(-1)).toMatchObject({ force: true, width: 80, height: 24 });
    await env.stop(handle);
  });

  it('keeps what the app last drew: a key before the resize is in the repainted frame', async () => {
    const env = createCanvasEnv();
    const handle = await mounted(env);
    const presenter = env.backends.created[0];
    env.press('a');
    await env.drive();
    const before = presenter?.presents.length ?? 0;
    env.host.box(804, 480);
    await env.drive();
    expect(presenter?.presents.length).toBe(before + 1);
    expect(presenter?.presents.at(-1)).toMatchObject({ force: true, width: 80, height: 24 });
    expect(handle.model()).toEqual({ count: 1 });
    await env.stop(handle);
  });

  it('still presents once, at the new grid, when the grid does change', async () => {
    const env = createCanvasEnv();
    const handle = await mounted(env);
    const presenter = env.backends.created[0];
    const before = presenter?.presents.length ?? 0;
    env.host.box(400, 240);
    await env.drive();
    expect(presenter?.presents.length).toBe(before + 1);
    expect(presenter?.presents.at(-1)).toMatchObject({ force: true, width: 40, height: 12 });
    await env.stop(handle);
  });

  it('does not present after stop()', async () => {
    const env = createCanvasEnv();
    const handle = await mounted(env);
    const presenter = env.backends.created[0];
    await env.stop(handle);
    const before = presenter?.presents.length ?? 0;
    env.host.box(807, 480);
    await env.drive();
    expect(presenter?.presents.length).toBe(before);
  });
});
