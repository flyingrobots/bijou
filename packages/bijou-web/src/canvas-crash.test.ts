import { describe, expect, it } from 'vitest';
import { isKeyMsg, type App } from '@flyingrobots/bijou-tui';
import { stringToSurface } from '@flyingrobots/bijou';
import { mountBijouCanvas } from './index.js';
import { createCanvasEnv } from './canvas-env.test-support.js';

/** An app whose update throws on `x`. */
const crashingApp: App<number> = {
  init: () => [0, []],
  update: (msg, model) => {
    if (isKeyMsg(msg) && msg.key === 'x') throw new Error('update exploded');
    return [model, []];
  },
  view: (model) => stringToSurface(`n ${String(model)}`, 8, 1),
};

describe('mountBijouCanvas() after an app crash', () => {
  it('stop() after an app crash ends the run with the crash error', async () => {
    const env = createCanvasEnv();
    const mounting = mountBijouCanvas(crashingApp, env.container, env.options());
    env.host.box(800, 480);
    const handle = await mounting;
    const done = handle.done.catch((error: unknown) => error);
    await env.drive();
    env.press('x');
    await env.drive();
    const stopping = handle.stop();
    await env.drive();
    await stopping;
    expect(await done).toMatchObject({ message: 'update exploded' });
    expect(env.container.children).toEqual([]);
    expect(env.backends.live()).toBe(0);
    expect(env.clockHost.liveTimers()).toBe(0);
  });
});
