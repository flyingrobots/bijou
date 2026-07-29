import { resolve as resolvePath } from 'node:path';
import {
  installRuntimeViewportOverlay,
  readRuntimeViewport,
  updateRuntimeViewport,
} from '@flyingrobots/bijou';
import {
  type BijouWorkerData,
  type WorkerSerializableOptions,
} from './worker-data.js';
import {
  DISABLE_MOUSE,
  mouseModeEnableSequence,
  resolveWorkerMouseMode,
} from './worker-mouse-mode.js';
import type { RunWorkerOptions, WorkerHandle } from './worker-options.js';
import {
  type MainMessage,
  type WorkerMessage,
  type WorkerThreadBindings,
  defaultWorkerThreadBindings,
} from './worker.part01.js';

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
  const mouseMode = resolveWorkerMouseMode(options);
  const useMouse = mouseMode !== undefined;

  if (useAltScreen || useHideCursor) {
    ctx.io.write('\x1b[?1049h'); // ENTER_ALT_SCREEN
    if (useHideCursor) ctx.io.write('\x1b[?25l'); // HIDE_CURSOR
  }
  if (useMouse) {
    ctx.io.write(mouseModeEnableSequence(mouseMode)); // ENABLE_MOUSE
  } else {
    ctx.io.write(DISABLE_MOUSE);
  }

  const serializableOptions: WorkerSerializableOptions = {
    altScreen: options.altScreen,
    hideCursor: options.hideCursor,
    mouse: options.mouse,
    mouseMode: options.mouseMode,
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
    worker.postMessage({
      type: 'io:resize',
      ...nextViewport,
    } satisfies WorkerMessage);
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
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${String(code)}`));
      else resolve();
    });
    function cleanup() {
      inputHandle.dispose();
      resizeHandle.dispose();
      if (useMouse) {
        ctx.io.write(DISABLE_MOUSE);
      }
      if (useAltScreen || useHideCursor) {
        ctx.io.write('\x1b[?1049l'); // EXIT_ALT_SCREEN
        if (useHideCursor) ctx.io.write('\x1b[?25h'); // SHOW_CURSOR
      }
    }
  });
  return {
    send: (payload: unknown) => {
      worker.postMessage({ type: 'data', payload } satisfies WorkerMessage);
    },
    terminate: async () => {
      await worker.terminate();
    },
    onExit,
  };
}
