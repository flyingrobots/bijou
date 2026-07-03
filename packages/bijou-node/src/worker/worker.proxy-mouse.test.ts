import { describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { stringToSurface } from '@flyingrobots/bijou';
import type { RunOptions } from '@flyingrobots/bijou-tui';
import { startWorkerApp } from './worker.js';

describe('worker proxy mouse runtime', () => {
  it('keeps mouse parsing enabled without forwarding terminal mouse control frames', async () => {
    const posted: unknown[] = [];
    const enableMouseAny = '\x1b[?1000h\x1b[?1002l\x1b[?1003h\x1b[?1006h';
    const disableMouse = '\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1006l';
    let runAltScreen: boolean | undefined;
    let runHideCursor: boolean | undefined;
    let runMouseMode: RunOptions['mouseMode'] | undefined;
    const run = <M>(_app: unknown, options: RunOptions<M>) => {
      runAltScreen = options.altScreen;
      runHideCursor = options.hideCursor;
      runMouseMode = options.mouseMode;
      options.ctx?.io.write(enableMouseAny);
      options.ctx?.io.write(disableMouse);
      options.ctx?.io.write('frame');
      return Promise.resolve();
    };

    await startWorkerApp({
      init: () => [null, []],
      update: (msg, model) => [model, []],
      view: () => stringToSurface('worker', 6, 1),
    }, {
      isMainThread: false,
      parentPort: {
        on() { return undefined; },
        off() { return undefined; },
        postMessage(message: unknown) { posted.push(message); },
      },
      workerData: {
        isBijouWorker: true,
        options: { mouseMode: 'any' },
        runtime: { columns: 80, rows: 24 },
      },
      createWorker() {
        throw new Error('unexpected createWorker');
      },
      createNodeContext() { return createTestContext({ mode: 'interactive' }); },
      runApp: run,
      scheduleTimeout(callback, ms) { return setTimeout(callback, ms); },
    });

    expect(runAltScreen).toBe(false);
    expect(runHideCursor).toBe(false);
    expect(runMouseMode).toBe('any');
    expect(posted).not.toContainEqual({ type: 'render:frame', output: enableMouseAny });
    expect(posted).not.toContainEqual({ type: 'render:frame', output: disableMouse });
    expect(posted).toContainEqual({ type: 'render:frame', output: 'frame' });
    expect(posted).toContainEqual({ type: 'quit' });
  });
});
