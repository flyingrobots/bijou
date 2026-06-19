import { describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { stringToSurface } from '@flyingrobots/bijou';
import type { RunOptions } from '@flyingrobots/bijou-tui';
import { runInWorker, startWorkerApp, type MainMessage, type RunWorkerOptions } from './worker.js';

describe('worker proxy runtime', () => {
  it('only accepts worker-safe run options at type level', () => {
    const options: RunWorkerOptions = { entry: '/tmp/worker.mjs', mouse: true };

    expect(options.entry).toBe('/tmp/worker.mjs');

    // @ts-expect-error worker rejects bus middleware hooks.
    const withMiddlewares: RunWorkerOptions = { entry: '/tmp/worker.mjs', middlewares: [] };
    expect(withMiddlewares.entry).toBe('/tmp/worker.mjs');

    // @ts-expect-error worker rejects render pipeline hooks.
    const withPipeline: RunWorkerOptions = { entry: '/tmp/worker.mjs', configurePipeline: () => undefined };
    expect(withPipeline.entry).toBe('/tmp/worker.mjs');
  });

  it('includes the host runtime size in workerData and syncs sanitized resize events', async () => {
    const ctorCalls: { entry: string; options: Record<string, unknown> }[] = [];
    const posted: unknown[] = [];
    let exitHandler: (() => void) | undefined;

    class FakeWorker {
      constructor(entry: string, options: Record<string, unknown>) {
        ctorCalls.push({ entry, options });
      }
      postMessage(message: unknown) {
        posted.push(message);
      }
      on(
        event: 'message' | 'error' | 'exit',
        handler: ((value: MainMessage) => void) | ((value: Error) => void) | ((value: number) => void),
      ) {
        if (event === 'exit') {
          exitHandler = () => { Reflect.apply(handler, undefined, [0]); };
        }
      }
      terminate(): Promise<number> {
        exitHandler?.();
        return Promise.resolve(0);
      }
    }
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    let emitResize: ((columns: number, rows: number) => void) | undefined;

    ctx.io.rawInput = () => ({ dispose: () => undefined });
    ctx.io.onResize = (handler) => {
      emitResize = handler;
      return { dispose() { emitResize = undefined; } };
    };

    const handle = runInWorker(
      { ctx, entry: '/tmp/worker.mjs' },
      {
        isMainThread: true,
        parentPort: null,
        workerData: null,
        createWorker(entry, options) {
          return new FakeWorker(entry, options);
        },
        createNodeContext() { return createTestContext({ mode: 'interactive' }); },
        runApp: () => Promise.resolve(),
        scheduleTimeout(callback, ms) { return setTimeout(callback, ms); },
      },
    );

    expect(ctorCalls).toHaveLength(1);
    expect(ctorCalls[0]?.options.workerData).toMatchObject({
      isBijouWorker: true,
      runtime: { columns: 120, rows: 40 },
    });

    emitResize?.(90.8, 22.2);
    expect(ctx.runtime.columns).toBe(90);
    expect(ctx.runtime.rows).toBe(22);
    expect(posted).toContainEqual({ type: 'io:resize', columns: 90, rows: 22 });

    await handle.terminate();
  });

  it('hydrates proxy runtime size before run() and updates it on resize messages', async () => {
    const messageListeners = new Set<(msg: unknown) => void>();
    const posted: unknown[] = [];
    let runCalls = 0;
    const run = <M>(_app: unknown, options: RunOptions<M>) => {
      runCalls += 1;
      const ctx = options.ctx ?? createTestContext({ mode: 'interactive' });
      expect(ctx.runtime.columns).toBe(120);
      expect(ctx.runtime.rows).toBe(40);

      const seenResizes: { columns: number; rows: number }[] = [];
      const handle = ctx.io.onResize((columns, rows) => {
        seenResizes.push({ columns, rows });
        expect(ctx.runtime.columns).toBe(columns);
        expect(ctx.runtime.rows).toBe(rows);
      });

      for (const listener of messageListeners) {
        listener({ type: 'io:resize', columns: 90, rows: 22 });
      }

      expect(seenResizes).toEqual([{ columns: 90, rows: 22 }]);
      handle.dispose();
      return Promise.resolve();
    };
    await startWorkerApp({
      init: () => [null, []],
      update: (msg, model) => [model, []],
      view: () => stringToSurface('worker', 6, 1),
    }, {
      isMainThread: false,
      parentPort: {
        on(_event: string, listener: (msg: unknown) => void) { messageListeners.add(listener); },
        off(_event: string, listener: (msg: unknown) => void) { messageListeners.delete(listener); },
        postMessage(message: unknown) { posted.push(message); },
      },
      workerData: {
        isBijouWorker: true,
        options: {},
        runtime: { columns: 120, rows: 40 },
      },
      createWorker() {
        throw new Error('unexpected createWorker');
      },
      createNodeContext() { return createTestContext({ mode: 'interactive' }); },
      runApp: run,
      scheduleTimeout(callback, ms) { return setTimeout(callback, ms); },
    });

    expect(runCalls).toBe(1);
    expect(posted).toContainEqual({ type: 'quit' });
  });
});
