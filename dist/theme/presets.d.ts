import type { Theme, BaseStatusKey } from './tokens.js';
/**
 * CYAN_MAGENTA — the default theme.
 *
 * Named ANSI → hex mapping used here:
 *   green   = #00ff00    cyan    = #00ffff    magenta = #ff00ff
 *   red     = #ff0000    yellow  = #ffff00    blue    = #0000ff
 *   gray    = #808080    white   = #ffffff
 */
export declare const CYAN_MAGENTA: Theme<BaseStatusKey>;
/**
 * TEAL_ORANGE_PINK — a gradient-based theme.
 *
 * Uses the gradient colors (#3bcfd4 → #fc9305 → #f20094) as the
 * foundation, with harmonized status/semantic tokens.
 */
export declare const TEAL_ORANGE_PINK: Theme<BaseStatusKey>;
/** Registry of all built-in presets, keyed by theme name. */
export declare const PRESETS: Record<string, Theme>;
//# sourceMappingURL=presets.d.ts.map