import { describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import type { RunOptions } from '@flyingrobots/bijou-tui';
import { runInWorker, startWorkerApp, type RunWorkerOptions } from './worker.js';

describe('worker proxy runtime', () => {
  it('only accepts worker-safe run options at type level', () => {
    const options: RunWorkerOptions = {
      entry: '/tmp/worker.mjs',
      mouse: true,
    };

    expect(options.entry).toBe('/tmp/worker.mjs');

    // @ts-expect-error Worker runtime does not support event bus middleware hooks.
    const withMiddlewares: RunWorkerOptions = { entry: '/tmp/worker.mjs', middlewares: [] };
    expect(withMiddlewares.entry).toBe('/tmp/worker.mjs');

    // @ts-expect-error Worker runtime does not support render pipeline hooks.
    const withPipeline: RunWorkerOptions = { entry: '/tmp/worker.mjs', configurePipeline() {} };
    expect(withPipeline.entry).toBe('/tmp/worker.mjs');
  });

  it('includes the host runtime size in workerData and syncs sanitized resize events', async () => {
    const ctorCalls: Array<{ entry: string; options: Record<string, unknown> }> = [];
    const posted: unknown[] = [];
    let exitHandler: ((code: number) => void) | undefined;

    class FakeWorker {
      constructor(entry: string, options: Record<string, unknown>) {
        ctorCalls.push({ entry, options });
      }
      postMessage(message: unknown) {
        posted.push(message);
      }
      on(event: string, handler: (value: any) => void) {
        if (event === 'exit') exitHandler = handler;
      }
      terminate(): Promise<number> {
        exitHandler?.(0);
        return Promise.resolve(0);
      }
    }
    const ctx = createTestContext({
      mode: 'interactive',
      runtime: { columns: 120, rows: 40 },
    });
    let emitResize: ((columns: number, rows: number) => void) | undefined;

    ctx.io.rawInput = () => ({ dispose() {} });
    ctx.io.onResize = (handler) => {
      emitResize = handler;
      return {
        dispose() {
          emitResize = undefined;
        },
      };
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
        createNodeContext() {
          return createTestContext({ mode: 'interactive' });
        },
        runApp: async () => {},
        scheduleTimeout(callback, ms) {
          return setTimeout(callback, ms);
        },
      },
    );

    expect(ctorCalls).toHaveLength(1);
    expect(ctorCalls[0]!.options.workerData).toMatchObject({
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
    const run = async <M>(_app: unknown, options: RunOptions<M>) => {
      runCalls += 1;
      const ctx = options.ctx!;
      expect(ctx.runtime.columns).toBe(120);
      expect(ctx.runtime.rows).toBe(40);

      const seenResizes: Array<{ columns: number; rows: number }> = [];
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
    };
    await startWorkerApp({
      init: () => [null, []],
      update: (msg, model) => [model, []],
      view: () => 'worker',
    }, {
      isMainThread: false,
      parentPort: {
        on(_event: string, listener: (msg: unknown) => void) {
          messageListeners.add(listener);
        },
        off(_event: string, listener: (msg: unknown) => void) {
          messageListeners.delete(listener);
        },
        postMessage(message: unknown) {
          posted.push(message);
        },
      },
      workerData: {
        isBijouWorker: true,
        options: {},
        runtime: { columns: 120, rows: 40 },
      },
      createWorker() {
        throw new Error('createWorker should not be used inside startWorkerApp tests');
      },
      createNodeContext() {
        return createTestContext({ mode: 'interactive' });
      },
      runApp: run,
      scheduleTimeout(callback, ms) {
        return setTimeout(callback, ms);
      },
    });

    expect(runCalls).toBe(1);
    expect(posted).toContainEqual({ type: 'quit' });
  });
});
