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

export type OutputMode = 'interactive' | 'static' | 'pipe' | 'accessible';

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
