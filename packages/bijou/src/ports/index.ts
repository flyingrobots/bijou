/**
 * Hexagonal-architecture port interfaces for bijou.
 *
 * @module
 */

export type { RuntimePort } from './runtime.js';
export type { WritePort, QueryPort, InteractivePort, FilePort, IOPort, RawInputHandle, TimerHandle } from './io.js';
export type { StylePort } from './style.js';
export type { BijouContext } from './context.js';
export { createEnvAccessor, createTTYAccessor } from './env.js';
