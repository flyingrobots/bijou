/**
 * Node.js adapter package for bijou.
 *
 * Re-exports the individual port adapters ({@link nodeRuntime},
 * {@link nodeIO}, {@link chalkStyle}) and provides convenience
 * functions for constructing a fully-wired {@link BijouContext}
 * bound to the current Node.js process.
 *
 * @packageDocumentation
 */

import { startApp } from './start-app.js';
import { _registerDefaultContextInitializerForTesting } from './node-default-context.js';

/** Re-export the Node.js {@link RuntimePort} factory. */
export { nodeRuntime, detectRefreshRate } from './runtime.js';
/** Re-export the Node.js {@link IOPort} factory. */
export {
  nodeIO,
  scopedNodeIO,
  ScopedNodeIOError,
  type ScopedNodeIO,
  type ScopedNodeIOOptions,
  type NodeIOOptions,
  type NodeWriteStream,
} from './io.js';
/** Re-export the Chalk-based {@link StylePort} factory and its options type. */
export { chalkStyle, type ChalkStyleOptions } from './style.js';
export type {
  CreateNodeContextOptions,
  InitDefaultContextOptions,
  NodeThemeEntry,
  NodeThemeMode,
  NodeThemeOptions,
} from './options.js';
export { createNodeContext } from './node-context.js';

/** Re-export Worker utilities for multi-threaded applications. */
export { isBijouWorker, runInWorker, sendToMain, startWorkerApp, type RunWorkerOptions } from './worker/worker.js';
export {
  recordDemoGif,
  rasterizeSurface,
  writeSurfaceGif,
  type NativeDemoSpec,
  type RecorderResult,
  type SurfaceGifOptions,
} from './recorder.js';

export { BijouBootstrapError } from './bootstrap-error.js';
export { initDefaultContext, _resetInitializedForTesting } from './node-default-context.js';
export { startApp, _registerDefaultContextInitializerForTesting };
export type { StartAppOptions } from './start-app.js';

_registerDefaultContextInitializerForTesting();
