import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { resolve as resolvePath } from 'node:path';
import {
  installRuntimeViewportOverlay,
  readRuntimeViewport,
  updateRuntimeViewport,
  type BijouContext,
} from '@flyingrobots/bijou';
import type { App, RunOptions } from '@flyingrobots/bijou-tui';
import { run } from '@flyingrobots/bijou-tui';
import { createNodeContext } from '../index.js';
import {
  hasBijouWorkerFlag,
  isObjectRecord,
  readBijouWorkerData,
  type BijouWorkerData,
  type WorkerSerializableOptions,
} from './worker-data.js';

interface WorkerInstance {
  postMessage(message: unknown): void;
  on(event: 'message', handler: (value: MainMessage) => void): void;
  on(event: 'error', handler: (value: Error) => void): void;
  on(event: 'exit', handler: (value: number) => void): void;
  terminate(): Promise<number>;
}

interface WorkerParentPort {
  on(event: 'message', listener: (msg: unknown) => void): void;
  off(event: 'message', listener: (msg: unknown) => void): void;
  postMessage(message: unknown): void;
}

interface WorkerThreadBindings {
  isMainThread: boolean;
  parentPort: WorkerParentPort | null;
  workerData: unknown;
  createWorker(entry: string, options: Record<string, unknown>): WorkerInstance;
  createNodeContext(): BijouContext;
  runApp<Model, M>(app: App<Model, M>, options: RunOptions<M>): Promise<void>;
  scheduleTimeout(callback: () => void, ms: number): ReturnType<typeof setTimeout>;
}

function defaultWorkerThreadBindings(): WorkerThreadBindings {
  return {
    isMainThread,
    parentPort,
    workerData,
    createWorker(entry, options) {
      return new Worker(entry, options);
    },
    createNodeContext,
    runApp: run,
    scheduleTimeout(callback, ms) {
      return setTimeout(callback, ms);
    },
  };
}

// ---------------------------------------------------------------------------
// Types & Messages
// ---------------------------------------------------------------------------

export type WorkerMessage =
  | { type: 'io:data'; data: string }
  | { type: 'io:resize'; columns: number; rows: number }
  | { type: 'data'; payload: unknown }
  | { type: 'quit' };

export type MainMessage =
  | { type: 'render:frame'; output: string }
  | { type: 'error'; message: string }
  | { type: 'data'; payload: unknown }
  | { type: 'quit' };

/**
 * Checks if the current environment is running inside a Bijou Worker.
 */
export function isBijouWorker(): boolean {
  const bindings = defaultWorkerThreadBindings();
  return !bindings.isMainThread && hasBijouWorkerFlag(bindings.workerData);
}

/**
 * Sends a custom data message from the worker to the main thread.
 * This will be received via the `onMessage` callback in `runInWorker`.
 */
export function sendToMain(payload: unknown): void {
  const bindings = defaultWorkerThreadBindings();
  if (bindings.parentPort) {
    bindings.parentPort.postMessage({ type: 'data', payload } satisfies MainMessage);
  }
}

/**
 * Options for starting an app in a background worker.
 */
export interface RunWorkerOptions {
  /** The absolute path to the file containing the worker entry point. */
  entry: string;
  /** Optional Bijou context for the host thread. */
  ctx?: BijouContext;
  /** Enter the alternate screen buffer on startup. */
  altScreen?: boolean;
  /** Hide the cursor on startup. */
  hideCursor?: boolean;
  /** Enable mouse input (SGR mode). */
  mouse?: boolean;
  /** Optional BCSS stylesheet string. */
  css?: string;
  /** Optional callback for custom data messages sent from the worker via `sendToMain`. */
  onMessage?: (payload: unknown) => void;
  /** Optional arguments passed to the Node.js worker process (e.g. ['--import', 'tsx']). */
  execArgv?: string[];
}

/**
 * Handle for a running background worker.
 */
export interface WorkerHandle {
  /** Sends a custom data message to the worker thread. */
  send(payload: unknown): void;
  /** Forcefully terminates the worker thread. */
  terminate(): Promise<void>;
  /** A promise that resolves when the worker exits cleanly. */
  onExit: Promise<void>;
}

/**
 * Spawns a background worker thread to run the TEA application.
 * The main thread delegates all logic to the worker, only handling raw I/O
 * and frame rendering (to keep the TTY responsive).
 *
 * @param options - Configuration including the path to the worker entry file.
 * @returns A handle to the running worker.
 */
export function runInWorker(
  options: RunWorkerOptions,
  bindings: WorkerThreadBindings = defaultWorkerThreadBindings(),
): WorkerHandle {
  if (!bindings.isMainThread) {
    throw new Error('runInWorker must be called from the main thread.');
  }

  const ctx = options.ctx ?? bindings.createNodeContext();
  installRuntimeViewportOverlay(ctx);
  const useAltScreen = options.altScreen ?? true;
  const useHideCursor = options.hideCursor ?? true;
  const useMouse = options.mouse ?? false;

  if (useAltScreen || useHideCursor) {
    ctx.io.write('\x1b[?1049h'); // ENTER_ALT_SCREEN
    if (useHideCursor) ctx.io.write('\x1b[?25l'); // HIDE_CURSOR
  }
  if (useMouse) {
    ctx.io.write('\x1b[?1000h\x1b[?1002h\x1b[?1006h'); // ENABLE_MOUSE
  }

  const serializableOptions: WorkerSerializableOptions = {
    altScreen: options.altScreen,
    hideCursor: options.hideCursor,
    mouse: options.mouse,
    css: options.css,
  };
  const worker = bindings.createWorker(resolvePath(options.entry), {
    workerData: {
      isBijouWorker: true,
      options: serializableOptions,
      runtime: readRuntimeViewport(ctx.runtime),
    } satisfies BijouWorkerData,
    execArgv: options.execArgv,
    // Pipe stdout/stderr so we can capture logs if needed, but primarily use IPC
  });
  const inputHandle = ctx.io.rawInput((data: string) => {
    worker.postMessage({ type: 'io:data', data } satisfies WorkerMessage);
  });
  const resizeHandle = ctx.io.onResize((columns: number, rows: number) => {
    const nextViewport = updateRuntimeViewport(ctx.runtime, columns, rows);
    worker.postMessage({ type: 'io:resize', ...nextViewport } satisfies WorkerMessage);
  });
  const onExit = new Promise<void>((resolve, reject) => {
    let requestedQuit = false;
    let forcedTerminate = false;
    worker.on('message', (msg: MainMessage) => {
      if (msg.type === 'render:frame') {
        ctx.io.write(msg.output);
      } else if (msg.type === 'error') {
        ctx.io.writeError(msg.message);
      } else if (msg.type === 'data') {
        options.onMessage?.(msg.payload);
      } else {
        requestedQuit = true;
        bindings.scheduleTimeout(() => {
          if (requestedQuit) {
            forcedTerminate = true;
            void worker.terminate();
          }
        }, 50);
      }
    });
    worker.on('error', (err) => {
      cleanup();
      reject(err);
    });
    worker.on('exit', (code) => {
      cleanup();
      if (requestedQuit && (code === 0 || forcedTerminate)) {
        resolve();
        return;
      }
      if (code !== 0) reject(new Error(`Worker stopped with exit code ${String(code)}`));
      else resolve();
    });
    function cleanup() {
      inputHandle.dispose();
      resizeHandle.dispose();
      if (useMouse) {
        ctx.io.write('\x1b[?1000l\x1b[?1002l\x1b[?1006l'); // DISABLE_MOUSE
      }
      if (useAltScreen || useHideCursor) {
        ctx.io.write('\x1b[?1049l'); // EXIT_ALT_SCREEN
        if (useHideCursor) ctx.io.write('\x1b[?25h'); // SHOW_CURSOR
      }
    }
  });
  return {
    send: (payload: unknown) => { worker.postMessage({ type: 'data', payload } satisfies WorkerMessage); },
    terminate: async () => { await worker.terminate(); },
    onExit
  };
}
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
    throw new Error('startWorkerApp must be called from within a worker thread.');
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

  proxyCtx.io.write = (data: string) => {
    port.postMessage({ type: 'render:frame', output: data } satisfies MainMessage);
  };
  proxyCtx.io.writeError = (data: string) => {
    port.postMessage({ type: 'error', message: data } satisfies MainMessage);
  };
  // We need to bypass the standard run() setup since the main thread
  // already handled alt screen and mouse modes. We tell run() to do nothing.
  const proxyOptions: RunOptions<M> = {
    ...initData.options,
    ctx: proxyCtx,
    altScreen: false,
    hideCursor: false,
    mouse: false,
  };
  proxyCtx.io.rawInput = (handler) => {
    const listener = (msg: unknown) => {
      if (!isWorkerMessage(msg)) return;
      if (msg.type === 'io:data') handler(msg.data);
    };
    port.on('message', listener);
    return {
      dispose: () => { port.off('message', listener); }
    };
  };
  proxyCtx.io.onResize = (handler) => {
    const listener = (msg: unknown) => {
      if (!isWorkerMessage(msg)) return;
      if (msg.type === 'io:resize') {
        const nextViewport = updateRuntimeViewport(proxyCtx.runtime, msg.columns, msg.rows);
        handler(nextViewport.columns, nextViewport.rows);
      }
    };
    port.on('message', listener);
    return {
      dispose: () => { port.off('message', listener); }
    };
  };
  proxyCtx.io.onData = (handler) => {
    const listener = (msg: unknown) => {
      if (!isWorkerMessage(msg)) return;
      if (msg.type === 'data') handler(msg.payload);
    };
    port.on('message', listener);
    return {
      dispose: () => { port.off('message', listener); }
    };
  };
  await bindings.runApp(app, proxyOptions);
  port.postMessage({ type: 'quit' } satisfies MainMessage);
}

function isWorkerMessage(msg: unknown): msg is WorkerMessage {
  if (!isObjectRecord(msg)) return false;
  if (msg['type'] === 'io:data') return typeof msg['data'] === 'string';
  if (msg['type'] === 'io:resize') {
    return typeof msg['columns'] === 'number' && typeof msg['rows'] === 'number';
  }
  return msg['type'] === 'data' || msg['type'] === 'quit';
}
