import type { RuntimePort } from '../ports/runtime.js';
import { sanitizeNonNegativeInt } from './numeric.js';

/** Sanitized terminal viewport dimensions. */
export interface RuntimeViewport {
  readonly columns: number;
  readonly rows: number;
}

/**
 * Clamp a terminal dimension to a non-negative integer.
 *
 * Runtime adapters may surface fractional, negative, or non-finite values
 * transiently during resize flows. The TUI runtime only operates on whole,
 * non-negative cell counts.
 */
export function sanitizeRuntimeDimension(value: number): number {
  return sanitizeNonNegativeInt(value, 0);
}

/** Read the current runtime viewport using Bijou's shared dimension rules. */
export function readRuntimeViewport(runtime: RuntimePort): RuntimeViewport {
  return {
    columns: sanitizeRuntimeDimension(runtime.columns),
    rows: sanitizeRuntimeDimension(runtime.rows),
  };
}

/**
 * Install a mutable viewport overlay on top of an existing runtime port.
 *
 * This gives runtimes backed by immutable globals (for example Node's
 * `process.stdout.columns`) a stable, writable source of truth for scripted
 * resizes and worker-proxy synchronization.
 */
export function installRuntimeViewportOverlay<T extends { runtime: RuntimePort }>(host: T): RuntimePort {
  const baseRuntime = host.runtime;
  const viewport = readRuntimeViewport(baseRuntime);
  const state = {
    columns: viewport.columns,
    rows: viewport.rows,
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
      state.columns = sanitizeRuntimeDimension(value);
    },
    get rows(): number {
      return state.rows;
    },
    set rows(value: number) {
      state.rows = sanitizeRuntimeDimension(value);
    },
    get refreshRate(): number {
      return baseRuntime.refreshRate;
    },
  };

  host.runtime = runtime;
  return runtime;
}

/**
 * Update a mutable runtime overlay with sanitized viewport dimensions.
 *
 * Use this after {@link installRuntimeViewportOverlay} when resize events or
 * worker messages need to advance the current runtime viewport source of truth.
 */
export function updateRuntimeViewport(
  runtime: RuntimePort,
  columns: number,
  rows: number,
): RuntimeViewport {
  runtime.columns = columns;
  runtime.rows = rows;
  return readRuntimeViewport(runtime);
}
