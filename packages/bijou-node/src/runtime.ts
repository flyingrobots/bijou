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
    /** @param key - Environment variable name. */
    env(key: string): string | undefined {
      return process.env[key];
    },
    get stdoutIsTTY(): boolean {
      return process.stdout.isTTY ?? false;
    },
    get stdinIsTTY(): boolean {
      return process.stdin.isTTY ?? false;
    },
    get columns(): number {
      return process.stdout.columns ?? 80;
    },
    get rows(): number {
      return process.stdout.rows ?? 24;
    },
  };
}
