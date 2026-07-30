import {
  createSurface,
  type ClockPort,
  type TimerHandle,
} from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { describe, expect, it } from 'vitest';
import { createEventBus } from './eventbus.js';
import { RuntimeFramebuffers } from './runtime-buffers.js';
import { createRuntimeRenderer } from './runtime-render.js';
import { createRuntimeSession } from './runtime-startup.js';
import type { App } from './types.js';

const handle = (): TimerHandle => ({ dispose: () => undefined });

function synchronousClock(): ClockPort {
  return {
    now: () => 0,
    date: (ms = 0) => new Date(ms),
    setTimeout(callback) {
      callback();
      return handle();
    },
    setInterval: () => handle(),
    queueMicrotask(callback) {
      callback();
    },
  };
}

describe('runtime render scheduling', () => {
  it('settles when the clock invokes timeout callbacks synchronously', () => {
    const clock = synchronousClock();
    const ctx = createTestContext({ mode: 'interactive', clock });
    const app: App<number> = {
      init: () => [0, []],
      update: (_message, model) => [model, []],
      view: () => createSurface(1, 1),
    };
    const session = createRuntimeSession(0);
    const renderer = createRuntimeRenderer({
      app,
      options: { ctx },
      hooks: undefined,
      ctx,
      clock,
      bus: createEventBus({ clock }),
      session,
      runtimeViewport: () => ({ columns: 1, rows: 1 }),
      routeRuntimeIssue: () => undefined,
      crash: (_phase, error) => {
        throw error;
      },
    }, new RuntimeFramebuffers(1, 1));

    expect(() => {
      renderer.render();
    }).not.toThrow();
    expect(renderer.hasPendingRender()).toBe(false);
  });
});
