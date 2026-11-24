import { describe, expect, it } from 'vitest';
import { mountBijouCanvas } from './index.js';
import { FakeRendererFaultError } from './canvas-backends.test-support.js';
import { counterApp, createCanvasEnv, type CanvasEnv } from './canvas-env.test-support.js';

/** Assert that nothing the mount attached is still attached. */
function expectNothingRetained(env: CanvasEnv): void {
  expect(env.container.children).toEqual([]);
  expect(env.backends.live()).toBe(0);
  expect(env.listeners()).toBe(0);
  expect(env.host.liveObservers()).toBe(0);
  expect(env.host.liveDprWatchers()).toBe(0);
  expect(env.clockHost.liveTimers()).toBe(0);
  expect(env.clockHost.liveFrames()).toBe(0);
  expect(env.clock.pendingHandles()).toBe(0);
}

describe('mountBijouCanvas() lifecycle', () => {
  it('stop() is idempotent and leaves no listener, observer, timer, frame or presenter', async () => {
    const env = createCanvasEnv();
    const mounting = mountBijouCanvas(counterApp, env.container, env.options());
    env.host.box(800, 480);
    const handle = await mounting;
    await env.drive();
    expect(env.listeners()).toBeGreaterThan(0);
    const first = handle.stop();
    const second = handle.stop();
    await env.drive();
    await Promise.all([first, second]);
    await handle.stop();
    await handle.done;
    expectNothingRetained(env);
  });

  it('defers the mount while the container has zero width, until the first non-zero box', async () => {
    const env = createCanvasEnv();
    const mounting = mountBijouCanvas(counterApp, env.container, env.options());
    env.host.box(0, 480);
    env.host.box(800, 0);
    await env.drive(2);
    expect(env.maker.made).toEqual([]);
    expect(env.container.children).toEqual([]);
    env.host.box(800, 480);
    const handle = await mounting;
    expect(handle.backend).toBe('webgpu');
    await env.stop(handle);
  });

  it('aborts a mount whose async WebGPU init is still pending, and disposes the late presenter', async () => {
    const env = createCanvasEnv();
    env.backends.outcomes.webgpu = 'deferred';
    const controller = new AbortController();
    const mounting = mountBijouCanvas(counterApp, env.container, env.options({ signal: controller.signal }));
    env.host.box(800, 480);
    await env.drive(1);
    expect(env.container.canvases()).toHaveLength(1);
    controller.abort();
    env.backends.resolveDeferred();
    await expect(mounting).rejects.toMatchObject({ code: 'BIJOU_WEB_CANVAS_ABORTED' });
    expect(env.backends.created).toHaveLength(1);
    expectNothingRetained(env);
  });

  it('aborts a mount that is still waiting for a non-zero box', async () => {
    const env = createCanvasEnv();
    const controller = new AbortController();
    const mounting = mountBijouCanvas(counterApp, env.container, env.options({ signal: controller.signal }));
    controller.abort();
    await expect(mounting).rejects.toMatchObject({ code: 'BIJOU_WEB_CANVAS_ABORTED' });
    expectNothingRetained(env);
  });

  it('refuses at once when the signal is already aborted', async () => {
    const env = createCanvasEnv();
    const controller = new AbortController();
    controller.abort();
    await expect(mountBijouCanvas(counterApp, env.container, env.options({ signal: controller.signal })))
      .rejects.toMatchObject({ code: 'BIJOU_WEB_CANVAS_ABORTED' });
    expect(env.host.liveObservers()).toBe(0);
  });

  it('stop() during an async WebGPU switch aborts it without leaking a canvas or presenter', async () => {
    const env = createCanvasEnv();
    env.backends.outcomes.webgpu = 'unavailable';
    const mounting = mountBijouCanvas(counterApp, env.container, env.options());
    env.host.box(800, 480);
    const handle = await mounting;
    env.backends.outcomes.webgpu = 'deferred';
    const switching = handle.switchBackend('webgpu');
    await env.drive(1);
    const stopping = handle.stop();
    env.backends.resolveDeferred();
    await expect(switching).rejects.toMatchObject({ code: 'BIJOU_WEB_CANVAS_ABORTED' });
    await env.drive();
    await stopping;
    expectNothingRetained(env);
  });

  it('ends the run loudly when a presenter faults while presenting', async () => {
    const env = createCanvasEnv();
    const faulty = {
      present() { throw new FakeRendererFaultError('webgpu', 'device lost'); },
      resize() { return undefined; },
      dispose() { return undefined; },
    };
    const mounting = mountBijouCanvas(counterApp, env.container, env.options({ presenters: { webgpu: () => faulty } }));
    env.host.box(800, 480);
    const handle = await mounting;
    const done = handle.done.catch((error: unknown) => error);
    await env.drive();
    expect(await done).toMatchObject({ code: 'GEORDI_E_BIJOU_RENDERER_FAULT' });
    expectNothingRetained(env);
  });

  it('writes accessible output through the output sink and mounts no canvas', async () => {
    const env = createCanvasEnv();
    const written: string[] = [];
    const handle = await mountBijouCanvas(counterApp, env.container, env.options({
      mode: 'accessible', context: { output: { write: (text) => { written.push(text); } } },
    }));
    await handle.done;
    expect(written.join('')).toContain('count 0');
    expect(handle.backend).toBeNull();
    expect(handle.canvas).toBeNull();
    await handle.stop();
    expectNothingRetained(env);
  });

  it('refuses loudly when the host has no ResizeObserver', async () => {
    const env = createCanvasEnv();
    const { host, ...withoutHost } = env.options();
    if (host === undefined) throw new Error('the fake environment supplied no host to remove');
    await expect(mountBijouCanvas(counterApp, env.container, withoutHost))
      .rejects.toMatchObject({ code: 'BIJOU_WEB_CANVAS_NO_RESIZE_OBSERVER' });
    expect(env.container.children).toEqual([]);
  });
});
