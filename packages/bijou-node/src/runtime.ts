import type { RuntimePort } from '@flyingrobots/bijou';

/**
 * Create a {@link RuntimePort} backed by Node.js `process` globals.
 *
 * Delegates environment variable lookups to `process.env` and terminal
 * geometry queries to `process.stdout`/`process.stdin`. Falls back to
 * sensible defaults (80 columns, 24 rows, non-TTY) when the underlying
 * properties are `undefined`.
 *
 * @returns A {@link RuntimePort} wired to the current Node.js process.
 */
export function nodeRuntime(): RuntimePort {
  return {
    /**
     * @param key - Environment variable name.
     * @returns The value of the environment variable, or `undefined` if not set.
     */
    env(key: string): string | undefined {
      return process.env[key];
    },
    /** Whether `process.stdout` is attached to a TTY. Falls back to `false`. */
    get stdoutIsTTY(): boolean {
      return process.stdout.isTTY ?? false;
    },
    /** Whether `process.stdin` is attached to a TTY. Falls back to `false`. */
    get stdinIsTTY(): boolean {
      return process.stdin.isTTY ?? false;
    },
    /** Terminal width in columns from `process.stdout`. Falls back to `80`. */
    get columns(): number {
      return process.stdout.columns ?? 80;
    },
    /** Terminal height in rows from `process.stdout`. Falls back to `24`. */
    get rows(): number {
      return process.stdout.rows ?? 24;
    },
  };
}
