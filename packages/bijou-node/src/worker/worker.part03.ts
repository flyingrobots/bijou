import {
  installRuntimeViewportOverlay,
  updateRuntimeViewport,
} from '@flyingrobots/bijou';
import type { App, RunOptions } from '@flyingrobots/bijou-tui';
import { isObjectRecord, readBijouWorkerData } from './worker-data.js';
import {
  DISABLE_MOUSE,
  mouseModeEnableSequence,
  resolveWorkerMouseMode,
} from './worker-mouse-mode.js';
import {
  type MainMessage,
  type WorkerMessage,
  type WorkerThreadBindings,
  defaultWorkerThreadBindings,
} from './worker.part01.js';

/**
 * The entry point for the worker thread. Must be called in the file
 * specified by `options.entry` in `runInWorker()`.
 *
 * Intercepts the normal `run()` execution, redirecting I/O to the parent port.
 *
 * @param app - The TEA app to run.
 */
export async function startWorkerApp<Model, M>(
  app: App<Model, M>,
  bindings: WorkerThreadBindings = defaultWorkerThreadBindings(),
): Promise<void> {
  const port = bindings.parentPort;
  if (bindings.isMainThread || port === null) {
    throw new Error(
      'startWorkerApp must be called from within a worker thread.',
    );
  }
  const initData = readBijouWorkerData(bindings.workerData);
  const proxyCtx = bindings.createNodeContext();
  installRuntimeViewportOverlay(proxyCtx);
  const { setDefaultContext } = await import('@flyingrobots/bijou');
  setDefaultContext(proxyCtx);
  updateRuntimeViewport(
    proxyCtx.runtime,
    initData.runtime.columns,
    initData.runtime.rows,
  );

  const proxyMouseMode = resolveWorkerMouseMode(initData.options);
  const ignoredProxyWrites = new Set<string>([DISABLE_MOUSE]);
  if (proxyMouseMode !== undefined) {
    ignoredProxyWrites.add(mouseModeEnableSequence(proxyMouseMode));
  }

  proxyCtx.io.write = (data: string) => {
    if (ignoredProxyWrites.has(data)) return;
    port.postMessage({
      type: 'render:frame',
      output: data,
    } satisfies MainMessage);
  };
  proxyCtx.io.writeError = (data: string) => {
    port.postMessage({ type: 'error', message: data } satisfies MainMessage);
  };
  // The main thread owns terminal mode; the worker still parses forwarded input.
  const proxyOptions: RunOptions<M> = {
    css: initData.options.css,
    ctx: proxyCtx,
    altScreen: false,
    hideCursor: false,
    mouse: initData.options.mouse,
    mouseMode: initData.options.mouseMode,
  };
  proxyCtx.io.rawInput = (handler) => {
    const listener = (msg: unknown) => {
      if (!isWorkerMessage(msg)) return;
      if (msg.type === 'io:data') handler(msg.data);
    };
    port.on('message', listener);
    return {
      dispose: () => {
        port.off('message', listener);
      },
    };
  };
  proxyCtx.io.onResize = (handler) => {
    const listener = (msg: unknown) => {
      if (!isWorkerMessage(msg)) return;
      if (msg.type === 'io:resize') {
        const nextViewport = updateRuntimeViewport(
          proxyCtx.runtime,
          msg.columns,
          msg.rows,
        );
        handler(nextViewport.columns, nextViewport.rows);
      }
    };
    port.on('message', listener);
    return {
      dispose: () => {
        port.off('message', listener);
      },
    };
  };
  proxyCtx.io.onData = (handler) => {
    const listener = (msg: unknown) => {
      if (!isWorkerMessage(msg)) return;
      if (msg.type === 'data') handler(msg.payload);
    };
    port.on('message', listener);
    return {
      dispose: () => {
        port.off('message', listener);
      },
    };
  };
  await bindings.runApp(app, proxyOptions);
  port.postMessage({ type: 'quit' } satisfies MainMessage);
}
export function isWorkerMessage(msg: unknown): msg is WorkerMessage {
  if (!isObjectRecord(msg)) return false;
  if (msg['type'] === 'io:data') return typeof msg['data'] === 'string';
  if (msg['type'] === 'io:resize') {
    return (
      typeof msg['columns'] === 'number' && typeof msg['rows'] === 'number'
    );
  }
  return msg['type'] === 'data' || msg['type'] === 'quit';
}
