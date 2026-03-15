import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import type { RunWorkerOptions } from './worker.js';

afterEach(() => {
  vi.resetModules();
  vi.unmock('node:worker_threads');
  vi.unmock('@flyingrobots/bijou-tui');
});

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

    vi.doMock('node:worker_threads', () => ({
      Worker: FakeWorker,
      isMainThread: true,
      parentPort: null,
      workerData: null,
    }));

    const { runInWorker } = await import('./worker.js');
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

    const handle = runInWorker({ ctx, entry: '/tmp/worker.mjs' });

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
  }, 10_000);

  it('hydrates proxy runtime size before run() and updates it on resize messages', async () => {
    const messageListeners = new Set<(msg: unknown) => void>();
    const posted: unknown[] = [];
    const run = vi.fn(async (_app, options: { ctx: { runtime: { columns: number; rows: number }; io: { onResize: (handler: (columns: number, rows: number) => void) => { dispose(): void } } } }) => {
      expect(options.ctx.runtime.columns).toBe(120);
      expect(options.ctx.runtime.rows).toBe(40);

      const seenResizes: Array<{ columns: number; rows: number }> = [];
      const handle = options.ctx.io.onResize((columns, rows) => {
        seenResizes.push({ columns, rows });
        expect(options.ctx.runtime.columns).toBe(columns);
        expect(options.ctx.runtime.rows).toBe(rows);
      });

      for (const listener of messageListeners) {
        listener({ type: 'io:resize', columns: 90, rows: 22 });
      }

      expect(seenResizes).toEqual([{ columns: 90, rows: 22 }]);
      handle.dispose();
    });

    vi.doMock('node:worker_threads', () => ({
      Worker: class {},
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
    }));

    vi.doMock('@flyingrobots/bijou-tui', async () => {
      const actual = await vi.importActual<typeof import('@flyingrobots/bijou-tui')>('@flyingrobots/bijou-tui');
      return {
        ...actual,
        run,
      };
    });

    const { startWorkerApp } = await import('./worker.js');
    await startWorkerApp({
      init: () => [null, []],
      update: (msg, model) => [model, []],
      view: () => 'worker',
    });

    expect(run).toHaveBeenCalledOnce();
    expect(posted).toContainEqual({ type: 'quit' });
  });
});
