/**
 * Terminal output mode detection.
 *
 * Detection order (first match wins):
 *   BIJOU_ACCESSIBLE=1    -> 'accessible'  (screen-reader-friendly plain prompts)
 *   NO_COLOR / TERM=dumb  -> 'pipe'        (no ANSI escapes)
 *   !stdout.isTTY         -> 'pipe'        (piped/redirected)
 *   CI=true               -> 'static'      (single-frame rendering)
 *   stdout.isTTY          -> 'interactive'  (full experience)
 */

import type { RuntimePort } from '../../ports/runtime.js';

/**
 * Terminal output mode.
 *
 * - `'interactive'` — full TUI experience with cursor movement and animation.
 * - `'static'` — single-frame rendering (e.g. CI environments).
 * - `'pipe'` — plain text, no ANSI escapes (piped stdout, `NO_COLOR`, `TERM=dumb`).
 * - `'accessible'` — screen-reader-friendly plain prompts (`BIJOU_ACCESSIBLE=1`).
 */
export type OutputMode = 'interactive' | 'static' | 'pipe' | 'accessible';

/**
 * Detect the appropriate output mode for the current environment.
 *
 * Inspects environment variables and TTY status via the optional
 * {@link RuntimePort} abstraction, falling back to Node.js `process`
 * globals when no port is provided.
 *
 * @param runtime - Optional runtime port for environment access. Falls back to `process`.
 * @returns The detected {@link OutputMode}.
 */
export function detectOutputMode(runtime?: RuntimePort): OutputMode {
  const env = runtime
    ? (key: string) => runtime.env(key)
    : (key: string) => process.env[key];
  const stdoutIsTTY = runtime ? runtime.stdoutIsTTY : (process.stdout.isTTY ?? false);

  if (env('BIJOU_ACCESSIBLE') === '1') return 'accessible';

  if (env('NO_COLOR') !== undefined) return 'pipe';
  if (env('TERM') === 'dumb') return 'pipe';

  if (!stdoutIsTTY) return 'pipe';

  if (env('CI') !== undefined) return 'static';

  return 'interactive';
}
