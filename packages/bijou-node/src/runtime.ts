import type { RuntimePort } from '@flyingrobots/bijou';

/**
 * Attempt to detect the system's refresh rate in Hz.
 * 
 * Currently defaults to 60, but provides an anchor for future
 * platform-specific detection (e.g. via native calls or shell commands).
 * 
 * @returns Detected refresh rate or 60.
 */
export function detectRefreshRate(): number {
  const envFps = process.env['BIJOU_FPS'];
  if (envFps) {
    const parsed = parseInt(envFps, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  
  // Future: add platform-specific detection logic here
  
  return 60;
}

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
    /** Refresh rate in FPS. Defaults to 60, or BIJOU_FPS if set. */
    get refreshRate(): number {
      return detectRefreshRate();
    },
  };
}
