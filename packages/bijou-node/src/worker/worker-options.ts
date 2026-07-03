import type { BijouContext } from '@flyingrobots/bijou';
import type { WorkerMouseTrackingMode } from './worker-mouse-mode.js';

/** Options for starting an app in a background worker. */
export interface RunWorkerOptions {
  /** The absolute path to the worker entry file. */
  entry: string;
  /** Optional Bijou context for the host thread. */
  ctx?: BijouContext;
  /** Enter the alternate screen buffer on startup. */
  altScreen?: boolean;
  /** Hide the cursor on startup. */
  hideCursor?: boolean;
  /** Enable mouse input. */
  mouse?: boolean;
  /** Mouse tracking mode. Supplying this implies `mouse: true`. */
  mouseMode?: WorkerMouseTrackingMode;
  /** Optional BCSS stylesheet string. */
  css?: string;
  /** Callback for custom data messages sent from the worker. */
  onMessage?: (payload: unknown) => void;
  /** Optional arguments passed to the Node.js worker process. */
  execArgv?: string[];
}

/** Handle for a running background worker. */
export interface WorkerHandle {
  /** Sends a custom data message to the worker thread. */
  send(payload: unknown): void;
  /** Forcefully terminate the worker thread. */
  terminate(): Promise<void>;
  /** Resolves when the worker exits cleanly. */
  onExit: Promise<void>;
}
