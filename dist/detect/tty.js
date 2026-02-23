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
export function detectOutputMode() {
    if (process.env['BIJOU_ACCESSIBLE'] === '1')
        return 'accessible';
    if (process.env['NO_COLOR'] !== undefined)
        return 'pipe';
    if (process.env['TERM'] === 'dumb')
        return 'pipe';
    if (!process.stdout.isTTY)
        return 'pipe';
    if (process.env['CI'] !== undefined)
        return 'static';
    return 'interactive';
}
//# sourceMappingURL=tty.js.map