import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { resolve as resolvePath } from 'node:path';
import type { BijouContext, RuntimePort } from '@flyingrobots/bijou';
import type { App, RunOptions } from '@flyingrobots/bijou-tui';
import { run } from '@flyingrobots/bijou-tui';
import { createNodeContext } from '../index.js';

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

// ---------------------------------------------------------------------------
// Worker Environment API
// ---------------------------------------------------------------------------

/**
 * Checks if the current environment is running inside a Bijou Worker.
 */
export function isBijouWorker(): boolean {
  return !isMainThread && workerData?.isBijouWorker === true;
}

/**
 * Sends a custom data message from the worker to the main thread.
 * This will be received via the `onMessage` callback in `runInWorker`.
 */
export function sendToMain(payload: unknown): void {
  if (parentPort) {
    parentPort.postMessage({ type: 'data', payload } satisfies MainMessage);
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

interface WorkerSerializableOptions {
  altScreen?: boolean;
  hideCursor?: boolean;
  mouse?: boolean;
  css?: string;
}

interface BijouWorkerData {
  isBijouWorker: true;
  options: WorkerSerializableOptions;
  runtime: {
    columns: number;
    rows: number;
  };
}

// ---------------------------------------------------------------------------
// Main Thread Logic
// ---------------------------------------------------------------------------

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
export function runInWorker(options: RunWorkerOptions): WorkerHandle {
  if (!isMainThread) {
    throw new Error('runInWorker must be called from the main thread.');
  }

  const ctx = options.ctx ?? createNodeContext();
  installRuntimeOverlay(ctx);
  const useAltScreen = options.altScreen ?? true;
  const useHideCursor = options.hideCursor ?? true;
  const useMouse = options.mouse ?? false;

  // Setup main thread screen
  if (useAltScreen || useHideCursor) {
    ctx.io.write('\x1b[?1049h'); // ENTER_ALT_SCREEN
    if (useHideCursor) ctx.io.write('\x1b[?25l'); // HIDE_CURSOR
  }
  if (useMouse) {
    ctx.io.write('\x1b[?1000h\x1b[?1002h\x1b[?1006h'); // ENABLE_MOUSE
  }

  // Spawn the worker with structured-clone-safe options only.
  const serializableOptions: WorkerSerializableOptions = {
    altScreen: options.altScreen,
    hideCursor: options.hideCursor,
    mouse: options.mouse,
    css: options.css,
  };

  const worker = new Worker(resolvePath(options.entry), {
    workerData: {
      isBijouWorker: true,
      options: serializableOptions,
      runtime: {
        columns: sanitizeDimension(ctx.runtime.columns),
        rows: sanitizeDimension(ctx.runtime.rows),
      },
    } satisfies BijouWorkerData,
    execArgv: options.execArgv,
    // Pipe stdout/stderr so we can capture logs if needed, but primarily use IPC
  });

  // 1. Pipe Main Stdin -> Worker IPC
  const inputHandle = ctx.io.rawInput((data: string) => {
    worker.postMessage({ type: 'io:data', data } satisfies WorkerMessage);
  });

  const resizeHandle = ctx.io.onResize((columns: number, rows: number) => {
    const nextColumns = sanitizeDimension(columns);
    const nextRows = sanitizeDimension(rows);
    ctx.runtime.columns = nextColumns;
    ctx.runtime.rows = nextRows;
    worker.postMessage({ type: 'io:resize', columns: nextColumns, rows: nextRows } satisfies WorkerMessage);
  });

  const onExit = new Promise<void>((resolve, reject) => {
    let requestedQuit = false;
    let forcedTerminate = false;

    // 2. Pipe Worker IPC -> Main Stdout
    worker.on('message', (msg: MainMessage) => {
      if (msg.type === 'render:frame') {
        ctx.io.write(msg.output);
      } else if (msg.type === 'error') {
        if (ctx.io.writeError) ctx.io.writeError(msg.message);
        else ctx.io.write(msg.message);
      } else if (msg.type === 'data') {
        if (options.onMessage) options.onMessage(msg.payload);
      } else if (msg.type === 'quit') {
        requestedQuit = true;
        setTimeout(() => {
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
      if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
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
    send: (payload: unknown) => worker.postMessage({ type: 'data', payload } satisfies WorkerMessage),
    terminate: async () => { await worker.terminate(); },
    onExit
  };
}

// ---------------------------------------------------------------------------
// Worker Thread Logic
// ---------------------------------------------------------------------------

/**
 * The entry point for the worker thread. Must be called in the file
 * specified by `options.entry` in `runInWorker()`.
 * 
 * Intercepts the normal `run()` execution, redirecting I/O to the parent port.
 * 
 * @param app - The TEA app to run.
 */
export async function startWorkerApp<Model, M>(app: App<Model, M>): Promise<void> {
  if (isMainThread || !parentPort) {
    throw new Error('startWorkerApp must be called from within a worker thread.');
  }

  const initData = workerData as BijouWorkerData;

  // Create a proxy Context that speaks IPC instead of true I/O
  const proxyCtx = createNodeContext();
  installRuntimeOverlay(proxyCtx);
  const { setDefaultContext } = await import('@flyingrobots/bijou');
  setDefaultContext(proxyCtx);
  proxyCtx.runtime.columns = sanitizeDimension(initData.runtime?.columns ?? proxyCtx.runtime.columns);
  proxyCtx.runtime.rows = sanitizeDimension(initData.runtime?.rows ?? proxyCtx.runtime.rows);
  
  // Hijack the WritePort to send frames back to main thread
  proxyCtx.io.write = (data: string) => {
    parentPort!.postMessage({ type: 'render:frame', output: data } satisfies MainMessage);
  };
  proxyCtx.io.writeError = (data: string) => {
    parentPort!.postMessage({ type: 'error', message: data } satisfies MainMessage);
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

  // Override the io.rawInput to listen to IPC messages instead of process.stdin
  proxyCtx.io.rawInput = (handler) => {
    const listener = (msg: WorkerMessage) => {
      if (msg.type === 'io:data') handler(msg.data);
    };
    parentPort!.on('message', listener);
    return {
      dispose: () => parentPort!.off('message', listener)
    };
  };

  proxyCtx.io.onResize = (handler) => {
    const listener = (msg: WorkerMessage) => {
      if (msg.type === 'io:resize') {
        proxyCtx.runtime.columns = sanitizeDimension(msg.columns);
        proxyCtx.runtime.rows = sanitizeDimension(msg.rows);
        handler(proxyCtx.runtime.columns, proxyCtx.runtime.rows);
      }
    };
    parentPort!.on('message', listener);
    return {
      dispose: () => parentPort!.off('message', listener)
    };
  };

  proxyCtx.io.onData = (handler) => {
    const listener = (msg: WorkerMessage) => {
      if (msg.type === 'data') handler(msg.payload);
    };
    parentPort!.on('message', listener);
    return {
      dispose: () => parentPort!.off('message', listener)
    };
  };

  // Run the app using the proxy context
  await run(app, proxyOptions);

  // Signal main thread to shut down
  parentPort.postMessage({ type: 'quit' } satisfies MainMessage);
}

function sanitizeDimension(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function installRuntimeOverlay(ctx: BijouContext): RuntimePort {
  const baseRuntime = ctx.runtime;
  const state = {
    columns: sanitizeDimension(baseRuntime.columns),
    rows: sanitizeDimension(baseRuntime.rows),
  };
  const runtime: RuntimePort = {
    env(key: string): string | undefined {
      return baseRuntime.env(key);
    },
    get stdoutIsTTY(): boolean {
      return baseRuntime.stdoutIsTTY;
    },
    get stdinIsTTY(): boolean {
      return baseRuntime.stdinIsTTY;
    },
    get columns(): number {
      return state.columns;
    },
    set columns(value: number) {
      state.columns = sanitizeDimension(value);
    },
    get rows(): number {
      return state.rows;
    },
    set rows(value: number) {
      state.rows = sanitizeDimension(value);
    },
    get refreshRate(): number {
      return baseRuntime.refreshRate;
    },
  };

  (ctx as { runtime: RuntimePort }).runtime = runtime;
  return runtime;
}
