import { describe, expect, it } from 'vitest';
import { mountBijouCanvas } from './index.js';
import { counterApp, createCanvasEnv } from './canvas-env.test-support.js';

describe('mountBijouCanvas() stress', () => {
  it('leaves zero listeners, observers, timers or presenters after 50 mount, switch and stop cycles', async () => {
    const env = createCanvasEnv();
    const targets = ['webgl2', 'canvas2d', 'webgpu'] as const;
    for (let cycle = 0; cycle < 50; cycle++) {
      const mounting = mountBijouCanvas(counterApp, env.container, env.options());
      env.host.box(800, 480);
      const handle = await mounting;
      env.press('a');
      await handle.switchBackend(targets[cycle % 3] ?? 'webgl2');
      await env.drive(2);
      await handle.stop();
      expect(env.container.children).toEqual([]);
      expect(env.listeners()).toBe(0);
      expect(env.host.liveObservers()).toBe(0);
      expect(env.host.liveDprWatchers()).toBe(0);
      expect(env.clockHost.liveTimers()).toBe(0);
      expect(env.clockHost.liveFrames()).toBe(0);
      expect(env.backends.live()).toBe(0);
    }
    expect(env.backends.created).toHaveLength(100);
    expect(env.maker.made).toHaveLength(100);
  });
});
