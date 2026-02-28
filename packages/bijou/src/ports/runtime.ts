/**
 * Abstract runtime environment port.
 *
 * Provides access to environment variables and terminal dimensions
 * without coupling to Node.js `process` globals.
 */
export interface RuntimePort {
  /** Read an environment variable. Returns `undefined` when unset. */
  env(key: string): string | undefined;
  /** Whether stdout is connected to an interactive terminal. */
  stdoutIsTTY: boolean;
  /** Whether stdin is connected to an interactive terminal. */
  stdinIsTTY: boolean;
  /** Current terminal width in columns. */
  columns: number;
  /** Current terminal height in rows. */
  rows: number;
}
