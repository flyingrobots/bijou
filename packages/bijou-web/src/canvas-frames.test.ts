import { describe, expect, it } from 'vitest';
import { createSurface, type BijouContext, type Surface } from '@flyingrobots/bijou';
import { mountBijouCanvas } from './index.js';
import { createFrameBridge } from './canvas-frames.js';
import { counterApp, createCanvasEnv, type CanvasEnv } from './canvas-env.test-support.js';
import { createWebContext } from './context.js';

async function mounted(env: CanvasEnv) {
  const mounting = mountBijouCanvas(counterApp, env.container, env.options());
  env.host.box(800, 480);
  const handle = await mounting;
  await env.drive();
  return handle;
}

const macrotask = (): Promise<void> => new Promise((resolve) => { setTimeout(resolve, 0); });

/** A Surface without packed storage: every member forwards to a packed one. */
function unpackedSurface(): Surface {
  const inner = createSurface(2, 1);
  return {
    width: inner.width, height: inner.height, cells: inner.cells,
    clear: () => { inner.clear(); },
    get: (x, y, mask) => inner.get(x, y, mask),
    set: (x, y, cell, mask) => { inner.set(x, y, cell, mask); },
    setRGB: (x, y, char, r, g, b, br, bg, bb, flags) => { inner.setRGB(x, y, char, r, g, b, br, bg, bb, flags); },
    fill: (cell, x, y, width, height, mask) => { inner.fill(cell, x, y, width, height, mask); },
    blit: (source, x, y, sx, sy, sw, sh, mask) => { inner.blit(source, x, y, sx, sy, sw, sh, mask); },
    transform: (source, matrix, options) => { inner.transform(source, matrix, options); },
    getRow: (y, x, width, mask) => inner.getRow(y, x, width, mask),
    setRow: (y, cells, x, mask) => { inner.setRow(y, cells, x, mask); },
    clone: () => inner.clone(),
  };
}

describe('mountBijouCanvas() frames', () => {
  it('presents the first frame with a full refresh at the grid size of the container', async () => {
    const env = createCanvasEnv();
    const handle = await mounted(env);
    const presenter = env.backends.created[0];
    expect(presenter?.resizes).toEqual([{ cssWidth: 800, cssHeight: 480, dpr: 1 }]);
    expect(presenter?.presents[0]).toMatchObject({ force: true, width: 80, height: 24 });
    expect(handle.ctx.runtime.columns).toBe(80);
    expect(handle.ctx.runtime.rows).toBe(24);
    await handle.stop();
  });

  it('coalesces every runtime frame between two animation frames into one present', async () => {
    const env = createCanvasEnv();
    const handle = await mounted(env);
    const presents = env.backends.created[0]?.presents ?? [];
    const before = presents.length;
    for (let i = 0; i < 3; i++) {
      env.press('a');
      await macrotask();
      env.clockHost.advance(20);
    }
    expect(presents.length).toBe(before);
    expect(env.clockHost.liveFrames()).toBe(1);
    env.clockHost.frame(10_000);
    expect(presents.length).toBe(before + 1);
    expect(presents.at(-1)).toMatchObject({ force: false });
    expect(presents.at(-1)?.dirty).toBeGreaterThan(0);
    expect(handle.model()).toEqual({ count: 3 });
    await handle.stop();
  });

  it('resizes the presenter and the grid when the container box changes', async () => {
    const env = createCanvasEnv();
    const handle = await mounted(env);
    env.host.box(400, 240);
    await env.drive();
    const presenter = env.backends.created[0];
    expect(presenter?.resizes.at(-1)).toEqual({ cssWidth: 400, cssHeight: 240, dpr: 1 });
    expect(presenter?.presents.at(-1)).toMatchObject({ force: true, width: 40, height: 12 });
    expect([handle.ctx.runtime.columns, handle.ctx.runtime.rows]).toEqual([40, 12]);
    await handle.stop();
  });

  it('uses the device-pixel content box and follows DPR changes', async () => {
    const env = createCanvasEnv();
    const handle = await mounted(env);
    env.host.box(800, 480, { width: 1600, height: 960 });
    await env.drive();
    expect([handle.ctx.runtime.columns, handle.ctx.runtime.rows]).toEqual([160, 48]);
    env.host.box(800, 480);
    env.host.changeDpr(2);
    await env.drive();
    expect(env.backends.created[0]?.resizes.at(-1)).toEqual({ cssWidth: 800, cssHeight: 480, dpr: 2 });
    expect([handle.ctx.runtime.columns, handle.ctx.runtime.rows]).toEqual([160, 48]);
    await handle.stop();
  });

  it('refuses a Surface without packed storage instead of dropping its dirty bits', () => {
    const bridge = createFrameBridge({ requestFrame: () => ({ dispose: () => undefined }), onFault: () => undefined });
    const ctx: BijouContext = createWebContext();
    const packed = createSurface(2, 1);
    expect(() => { bridge.present(unpackedSurface(), packed, ctx); }).toThrow(expect.objectContaining({
      code: 'BIJOU_WEB_CANVAS_UNPACKED_SURFACE',
    }));
    expect(() => { bridge.present(packed, unpackedSurface(), ctx); }).toThrow(/packed/u);
  });
});
