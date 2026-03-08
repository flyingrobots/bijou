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
import { createEnvAccessor, createTTYAccessor } from '../../ports/env.js';

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
 * Inspects environment variables and TTY status via the
 * {@link RuntimePort} abstraction.
 *
 * @param runtime - Runtime port for environment access.
 * @returns The detected {@link OutputMode}.
 */
export function detectOutputMode(runtime: RuntimePort): OutputMode {
  const env = createEnvAccessor(runtime);
  const stdoutIsTTY = createTTYAccessor(runtime);

  if (env('BIJOU_ACCESSIBLE') === '1') return 'accessible';

  if (env('NO_COLOR') !== undefined) return 'pipe';
  if (env('TERM') === 'dumb') return 'pipe';

  if (!stdoutIsTTY) return 'pipe';

  if (env('CI') !== undefined) return 'static';

  return 'interactive';
}

/**
 * Terminal color scheme.
 *
 * - `'dark'` — light text on a dark background (most terminals).
 * - `'light'` — dark text on a light background.
 */
export type ColorScheme = 'light' | 'dark';

/**
 * Detect whether the terminal background is light or dark.
 *
 * Reads the `COLORFGBG` environment variable (format `"fg;bg"` or
 * `"default;fg;bg"`). The last segment is treated as the background
 * color index: 0–6 → dark, 7+ → light.
 *
 * @param runtime - Runtime port for environment access.
 * @returns The detected {@link ColorScheme}. Defaults to `'dark'`.
 */
export function detectColorScheme(runtime: RuntimePort): ColorScheme {
  const env = createEnvAccessor(runtime);
  const raw = env('COLORFGBG');

  if (raw === undefined) return 'dark';

  const parts = raw.split(';');
  // split() always returns >= 1 element, so last is never undefined
  const last = parts[parts.length - 1]!;

  const bg = parseInt(last, 10);
  if (isNaN(bg)) return 'dark';

  return bg >= 7 ? 'light' : 'dark';
}
