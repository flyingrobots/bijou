/**
 * Shared environment and TTY accessors for hexagonal port fallbacks.
 *
 * Centralizes the `process.env` / `process.stdout.isTTY` fallback logic
 * so that multiple modules (tty.ts, resolve.ts) share a single definition
 * instead of each maintaining their own copy.
 *
 * @module ports/env
 */

import type { RuntimePort } from './runtime.js';

/**
 * Build an environment variable accessor from a runtime port.
 *
 * When a {@link RuntimePort} is provided, reads from `runtime.env()`.
 * Otherwise falls back to `process.env` (Node.js global).
 *
 * @param runtime - Optional runtime port for environment access.
 * @returns A function that reads a single env var by key.
 */
export function createEnvAccessor(runtime?: RuntimePort): (key: string) => string | undefined {
  return runtime
    ? (key: string) => runtime.env(key)
    : (key: string) => process.env[key];
}

/**
 * Build a TTY status accessor from a runtime port.
 *
 * When a {@link RuntimePort} is provided, reads `runtime.stdoutIsTTY`.
 * Otherwise falls back to `process.stdout.isTTY` (Node.js global).
 *
 * @param runtime - Optional runtime port for TTY status.
 * @returns Whether stdout is a TTY.
 */
export function createTTYAccessor(runtime?: RuntimePort): boolean {
  return runtime?.stdoutIsTTY ?? (process.stdout.isTTY === true);
}
