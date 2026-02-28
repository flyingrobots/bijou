import type { RuntimePort } from '../../ports/runtime.js';

/**
 * Configuration for {@link mockRuntime}.
 */
export interface MockRuntimeOptions {
  /** Environment variables to expose. Defaults to an empty record. */
  env?: Record<string, string>;
  /** Whether stdout is a TTY. Defaults to `true`. */
  stdoutIsTTY?: boolean;
  /** Whether stdin is a TTY. Defaults to `true`. */
  stdinIsTTY?: boolean;
  /** Terminal width in columns. Defaults to `80`. */
  columns?: number;
  /** Terminal height in rows. Defaults to `24`. */
  rows?: number;
}

/**
 * Create an in-memory {@link RuntimePort} for tests.
 *
 * Provide deterministic environment variables and terminal dimensions
 * without depending on the real `process` global.
 *
 * @param options - Optional overrides for environment and terminal geometry.
 * @returns A {@link RuntimePort} backed by the supplied (or default) values.
 */
export function mockRuntime(options: MockRuntimeOptions = {}): RuntimePort {
  const envMap = options.env ?? {};
  return {
    /**
     * Look up an environment variable by key.
     * @param key - The variable name.
     * @returns The value, or `undefined` if not set.
     */
    env(key: string): string | undefined {
      return envMap[key];
    },
    stdoutIsTTY: options.stdoutIsTTY ?? true,
    stdinIsTTY: options.stdinIsTTY ?? true,
    columns: options.columns ?? 80,
    rows: options.rows ?? 24,
  };
}
