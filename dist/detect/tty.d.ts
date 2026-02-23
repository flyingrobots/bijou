/**
 * Terminal output mode detection.
 *
 * Detection order (first match wins):
 *   BIJOU_ACCESSIBLE=1    → 'accessible'  (screen-reader-friendly plain prompts)
 *   NO_COLOR / TERM=dumb  → 'pipe'        (no ANSI escapes)
 *   !stdout.isTTY         → 'pipe'        (piped/redirected)
 *   CI=true               → 'static'      (single-frame rendering)
 *   stdout.isTTY          → 'interactive'  (full experience)
 */
export type OutputMode = 'interactive' | 'static' | 'pipe' | 'accessible';
export declare function detectOutputMode(): OutputMode;
//# sourceMappingURL=tty.d.ts.map