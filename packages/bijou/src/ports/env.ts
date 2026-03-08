/**
 * Shared environment and TTY accessors built on {@link RuntimePort}.
 *
 * Provides consistent env-var and TTY-status reading for modules
 * (tty.ts, resolve.ts) via the hexagonal port boundary.
 *
 * @module ports/env
 */

import type { RuntimePort } from './runtime.js';

/**
 * Build an environment variable accessor from a runtime port.
 *
 * @param runtime - Runtime port for environment access.
 * @returns A function that reads a single env var by key.
 */
export function createEnvAccessor(runtime: RuntimePort): (key: string) => string | undefined {
  return (key: string) => runtime.env(key);
}

/**
 * Build a TTY status accessor from a runtime port.
 *
 * @param runtime - Runtime port for TTY status.
 * @returns Whether stdout is a TTY.
 */
export function createTTYAccessor(runtime: RuntimePort): boolean {
  return runtime.stdoutIsTTY;
}
