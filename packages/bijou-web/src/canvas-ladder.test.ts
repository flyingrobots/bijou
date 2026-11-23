import { describe, expect, it } from 'vitest';
import { mountBijouCanvas } from './index.js';
import { counterApp, createCanvasEnv } from './canvas-env.test-support.js';

async function mountAt(env: ReturnType<typeof createCanvasEnv>, overrides: Parameters<typeof env.options>[0] = {}) {
  const mounting = mountBijouCanvas(counterApp, env.container, env.options(overrides));
  env.host.box(800, 480);
  return await mounting;
}

describe('mountBijouCanvas() backend ladder', () => {
  it('uses WebGPU first in auto mode and records no fallback', async () => {
    const env = createCanvasEnv();
    const handle = await mountAt(env);
    expect(handle.backend).toBe('webgpu');
    expect(handle.fallbackReasons).toEqual([]);
    expect(env.backends.attempts).toEqual(['webgpu#1']);
    expect(env.container.canvases()).toEqual([env.maker.made[0]]);
    await handle.stop();
  });

  it('tries webgpu, then webgl2, then canvas2d in strict order and records each exact reason', async () => {
    const env = createCanvasEnv();
    env.backends.outcomes.webgpu = 'unavailable';
    env.backends.outcomes.webgl2 = 'unavailable';
    const handle = await mountAt(env);
    expect(handle.backend).toBe('canvas2d');
    expect(env.backends.attempts).toEqual(['webgpu#1', 'webgl2#2', 'canvas2d#3']);
    expect(handle.fallbackReasons).toEqual([
      { backend: 'webgpu', code: 'GEORDI_E_BIJOU_BACKEND_UNAVAILABLE', reason: 'no webgpu on this host' },
      { backend: 'webgl2', code: 'GEORDI_E_BIJOU_BACKEND_UNAVAILABLE', reason: 'no webgl2 on this host' },
    ]);
    expect(env.container.canvases().map((canvas) => canvas.id)).toEqual([3]);
    await handle.stop();
  });

  it('mounts a fresh canvas after a backend fails once it has bound a context', async () => {
    const env = createCanvasEnv();
    env.backends.outcomes.webgpu = 'unavailable';
    env.backends.outcomes.webgl2 = 'unavailable-after-context';
    const handle = await mountAt(env);
    const [, webgl2Canvas, canvas2dCanvas] = env.maker.made;
    expect(webgl2Canvas?.bound()).toBe('webgl2');
    expect(webgl2Canvas?.parentNode).toBeNull();
    expect(canvas2dCanvas?.bound()).toBe('2d');
    expect(handle.canvas).toBe(canvas2dCanvas);
    expect(handle.fallbackReasons.map((entry) => entry.reason)).toEqual(['no webgpu on this host', 'device lost at configure']);
    await handle.stop();
  });

  it('skips a backend that has no factory in auto mode and says so', async () => {
    const env = createCanvasEnv();
    const handle = await mountAt(env, { presenters: { canvas2d: env.backends.presenters.canvas2d } });
    expect(handle.backend).toBe('canvas2d');
    expect(handle.fallbackReasons).toEqual([
      { backend: 'webgpu', code: 'BIJOU_WEB_CANVAS_NO_FACTORY', reason: 'no webgpu presenter factory was supplied' },
      { backend: 'webgl2', code: 'BIJOU_WEB_CANVAS_NO_FACTORY', reason: 'no webgl2 presenter factory was supplied' },
    ]);
    await handle.stop();
  });

  it('stops loudly on a renderer fault in auto mode and never falls back', async () => {
    const env = createCanvasEnv();
    env.backends.outcomes.webgpu = 'fault';
    await expect(mountAt(env)).rejects.toMatchObject({ code: 'GEORDI_E_BIJOU_RENDERER_FAULT' });
    expect(env.backends.attempts).toEqual(['webgpu#1']);
    expect(env.container.children).toEqual([]);
    expect(env.host.liveObservers()).toBe(0);
  });

  it('fails a forced backend loudly when it is unavailable, with no fallback', async () => {
    const env = createCanvasEnv();
    env.backends.outcomes.webgpu = 'unavailable';
    await expect(mountAt(env, { backend: 'webgpu' })).rejects.toMatchObject({
      code: 'GEORDI_E_BIJOU_BACKEND_UNAVAILABLE', reason: 'no webgpu on this host',
    });
    expect(env.backends.attempts).toEqual(['webgpu#1']);
    expect(env.container.children).toEqual([]);
  });

  it('fails a forced backend that has no factory', async () => {
    const env = createCanvasEnv();
    await expect(mountAt(env, { backend: 'webgl2', presenters: {} })).rejects.toMatchObject({
      code: 'BIJOU_WEB_CANVAS_NO_FACTORY',
    });
  });

  it('reports every reason when no backend in the ladder is available', async () => {
    const env = createCanvasEnv();
    env.backends.outcomes.webgpu = 'unavailable';
    env.backends.outcomes.webgl2 = 'unavailable';
    env.backends.outcomes.canvas2d = 'unavailable';
    const failure: unknown = await mountAt(env).catch((error: unknown) => error);
    expect(failure).toMatchObject({ code: 'BIJOU_WEB_CANVAS_NO_BACKEND' });
    expect(Reflect.get(Object(failure), 'fallbackReasons')).toHaveLength(3);
    expect(env.container.children).toEqual([]);
  });

  it('accepts an injected predicate for unavailability', async () => {
    const env = createCanvasEnv();
    env.backends.outcomes.webgpu = 'fault';
    const handle = await mountAt(env, { isBackendUnavailable: () => true });
    expect(handle.backend).toBe('webgl2');
    expect(handle.fallbackReasons[0]?.code).toBe('GEORDI_E_BIJOU_RENDERER_FAULT');
    await handle.stop();
  });
});
