import { describe, expect, it } from 'vitest';
import { createTestContext, mockClock } from '@flyingrobots/bijou/adapters/test';
import { runInWorker, type MainMessage } from './worker.js';

/** A worker that reports a quit but never exits on its own; terminating it exits with code 1. */
function stubbornWorker() {
  const handlers: { message?: (msg: MainMessage) => void; exit?: (code: number) => void } = {};
  let terminations = 0;
  const worker = {
    postMessage: () => undefined,
    on(
      event: 'message' | 'error' | 'exit',
      handler: ((value: MainMessage) => void) | ((value: Error) => void) | ((value: number) => void),
    ) {
      if (event === 'message') handlers.message = (msg) => { Reflect.apply(handler, undefined, [msg]); };
      if (event === 'exit') handlers.exit = (code) => { Reflect.apply(handler, undefined, [code]); };
    },
    terminate(): Promise<number> {
      terminations += 1;
      handlers.exit?.(1);
      return Promise.resolve(1);
    },
  };
  return { worker, handlers, terminations: () => terminations };
}

describe('runInWorker quit grace period', () => {
  it('terminates a worker that has not exited 50 ms after it asked to quit, on the injected clock', async () => {
    const clock = mockClock();
    const stub = stubbornWorker();
    const ctx = createTestContext({ mode: 'interactive' });
    ctx.io.rawInput = () => ({ dispose: () => undefined });
    const handle = runInWorker({ ctx, entry: '/tmp/worker.mjs' }, {
      isMainThread: true,
      parentPort: null,
      workerData: null,
      createWorker: () => stub.worker,
      createNodeContext: () => ctx,
      runApp: () => Promise.resolve(),
      scheduleTimeout: (callback, ms) => clock.setTimeout(callback, ms),
    });

    stub.handlers.message?.({ type: 'quit' });
    clock.advanceBy(49);
    expect(stub.terminations()).toBe(0);
    clock.advanceBy(1);
    expect(stub.terminations()).toBe(1);
    // A forced exit after a requested quit is a clean stop, not a failure.
    await expect(handle.onExit).resolves.toBeUndefined();
  });
});
