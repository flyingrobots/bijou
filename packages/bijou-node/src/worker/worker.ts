import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { resolve as resolvePath } from 'node:path';
import type { App, RunOptions } from '@flyingrobots/bijou-tui';
import { run } from '@flyingrobots/bijou-tui';
import { createNodeContext } from '../index.js';

// ---------------------------------------------------------------------------
// Types & Messages
// ---------------------------------------------------------------------------

export type WorkerMessage =
  | { type: 'io:data'; data: string }
  | { type: 'io:resize'; columns: number; rows: number }
  | { type: 'data'; payload: any }
  | { type: 'quit' };

export type MainMessage =
  | { type: 'render:frame'; output: string }
  | { type: 'error'; message: string }
  | { type: 'data'; payload: any }
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
export function sendToMain(payload: any): void {
  if (parentPort) {
    parentPort.postMessage({ type: 'data', payload } satisfies MainMessage);
  }
}

/**
 * Options for starting an app in a background worker.
 */
export interface RunWorkerOptions extends RunOptions<any> {
  /** The absolute path to the file containing the worker entry point. */
  entry: string;
  /** Optional callback for custom data messages sent from the worker via `sendToMain`. */
  onMessage?: (payload: any) => void;
  /** Optional arguments passed to the Node.js worker process (e.g. ['--import', 'tsx']). */
  execArgv?: string[];
}

// ---------------------------------------------------------------------------
// Main Thread Logic
// ---------------------------------------------------------------------------

/**
 * Handle for a running background worker.
 */
export interface WorkerHandle {
  /** Sends a custom data message to the worker thread. */
  send(payload: any): void;
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

  const worker = new Worker(resolvePath(options.entry), {
    workerData: { isBijouWorker: true, options: { ...options, onMessage: undefined } },
    execArgv: options.execArgv,
    // Pipe stdout/stderr so we can capture logs if needed, but primarily use IPC
  });

  // 1. Pipe Main Stdin -> Worker IPC
  const inputHandle = ctx.io.rawInput((data: string) => {
    worker.postMessage({ type: 'io:data', data } satisfies WorkerMessage);
  });

  const resizeHandle = ctx.io.onResize((columns: number, rows: number) => {
    worker.postMessage({ type: 'io:resize', columns, rows } satisfies WorkerMessage);
  });

  const onExit = new Promise<void>((resolve, reject) => {
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
        worker.terminate();
      }
    });

    worker.on('error', (err) => {
      cleanup();
      reject(err);
    });

    worker.on('exit', (code) => {
      cleanup();
      if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
      else resolve();
    });

    function cleanup() {
      inputHandle.dispose();
      resizeHandle.dispose();

      if (useMouse) {
        ctx.io.write('\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1006l'); // DISABLE_MOUSE
      }
      if (useAltScreen || useHideCursor) {
        ctx.io.write('\x1b[?1049l'); // EXIT_ALT_SCREEN
        if (useHideCursor) ctx.io.write('\x1b[?25h'); // SHOW_CURSOR
      }
    }
  });

  return {
    send: (payload: any) => worker.postMessage({ type: 'data', payload } satisfies WorkerMessage),
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

  // Create a proxy Context that speaks IPC instead of true I/O
  const proxyCtx = createNodeContext();
  const { setDefaultContext } = await import('@flyingrobots/bijou');
  setDefaultContext(proxyCtx);
  
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
    ...workerData.options,
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
      if (msg.type === 'io:resize') handler(msg.columns, msg.rows);
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
