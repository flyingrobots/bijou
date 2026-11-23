import { describe, expect, it } from 'vitest';
import { mountBijouCanvas } from './index.js';
import { counterApp, createCanvasEnv, type CanvasEnv } from './canvas-env.test-support.js';
import { withPrevent } from './interactive.test-support.js';

async function mounted(env: CanvasEnv) {
  const mounting = mountBijouCanvas(counterApp, env.container, env.options());
  env.host.box(800, 480);
  const handle = await mounting;
  await env.drive();
  return handle;
}

describe('mountBijouCanvas() switchBackend()', () => {
  it('swaps the canvas and presenter while keeping the TEA model, focus and input wiring', async () => {
    const env = createCanvasEnv();
    const handle = await mounted(env);
    const textarea = handle.textarea;
    textarea?.focus();
    env.press('a');
    env.press('a');
    await env.drive();
    expect(handle.model()).toEqual({ count: 2 });
    const [oldCanvas] = env.maker.made;
    const [oldPresenter] = env.backends.created;

    await handle.switchBackend('webgl2');
    await env.drive();
    const newCanvas = env.maker.made[1];
    const newPresenter = env.backends.created[1];
    expect(handle.backend).toBe('webgl2');
    expect(handle.canvas).toBe(newCanvas);
    expect(env.container.canvases()).toEqual([newCanvas]);
    expect(oldCanvas?.parentNode).toBeNull();
    expect(oldCanvas?.listenerCount()).toBe(0);
    expect(oldPresenter?.disposed).toBe(true);
    expect(newPresenter?.presents[0]?.force).toBe(true);
    expect(handle.model()).toEqual({ count: 2 });
    expect(env.container.ownerDocument.activeElement).toBe(textarea);

    env.press('a');
    await env.drive();
    expect(handle.model()).toEqual({ count: 3 });
    expect(newCanvas?.listenerCount()).toBeGreaterThan(0);
    env.container.ownerDocument.activeElement = null;
    newCanvas?.dispatch('pointerdown', withPrevent({ clientX: 15, clientY: 25, button: 0 }));
    expect(env.container.ownerDocument.activeElement).toBe(textarea);
    expect(handle.cellFromPoint(15, 25)).toEqual({ col: 1, row: 1 });
    await handle.stop();
  });

  it('re-presents the last frame on the new presenter at once', async () => {
    const env = createCanvasEnv();
    const handle = await mounted(env);
    await handle.switchBackend('canvas2d');
    await env.drive(2);
    const presents = env.backends.created[1]?.presents ?? [];
    expect(presents[0]).toMatchObject({ force: true, width: 80, height: 24 });
    expect(env.backends.created[1]?.resizes).toEqual([{ cssWidth: 800, cssHeight: 480, dpr: 1 }]);
    await handle.stop();
  });

  it('keeps the current backend when the switch target is unavailable', async () => {
    const env = createCanvasEnv();
    const handle = await mounted(env);
    env.backends.outcomes.webgl2 = 'unavailable';
    await expect(handle.switchBackend('webgl2')).rejects.toMatchObject({ code: 'GEORDI_E_BIJOU_BACKEND_UNAVAILABLE' });
    expect(handle.backend).toBe('webgpu');
    expect(env.container.canvases()).toEqual([env.maker.made[0]]);
    expect(env.backends.live()).toBe(1);
    env.press('a');
    await env.drive();
    expect(handle.model()).toEqual({ count: 1 });
    await handle.stop();
  });

  it('runs overlapping switches one after another', async () => {
    const env = createCanvasEnv();
    const handle = await mounted(env);
    await Promise.all([handle.switchBackend('webgl2'), handle.switchBackend('canvas2d')]);
    expect(handle.backend).toBe('canvas2d');
    expect(env.container.canvases()).toEqual([env.maker.made[2]]);
    expect(env.backends.live()).toBe(1);
    await handle.stop();
  });

  it('refuses a switch after stop()', async () => {
    const env = createCanvasEnv();
    const handle = await mounted(env);
    await handle.stop();
    await expect(handle.switchBackend('webgl2')).rejects.toMatchObject({ code: 'BIJOU_WEB_CANVAS_STOPPED' });
    expect(env.maker.made).toHaveLength(1);
  });
});
