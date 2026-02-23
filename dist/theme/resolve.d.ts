import type { Theme, TokenValue, InkColor } from './tokens.js';
/** Checks the no-color.org spec: NO_COLOR defined (any value) means no color. */
export declare function isNoColor(): boolean;
export interface ResolvedTheme {
    theme: Theme;
    noColor: boolean;
    /** Returns hex string for Ink `color=` prop, or undefined when noColor. */
    ink(token: TokenValue): InkColor;
    /** Returns hex string for a status key, or undefined when noColor. */
    inkStatus(status: string): InkColor;
    /** Returns the raw hex string from a token (for chalk.hex() or boxen borderColor). */
    hex(token: TokenValue): string;
}
export interface ThemeResolverOptions {
    /** Environment variable name to read theme from. Default: 'BIJOU_THEME'. */
    envVar?: string;
    /** Preset registry. Default: bijou built-in PRESETS. */
    presets?: Record<string, Theme>;
    /** Fallback theme when env var / name doesn't match. Default: CYAN_MAGENTA. */
    fallback?: Theme;
}
export interface ThemeResolver {
    /** Returns the current resolved theme (cached singleton). */
    getTheme(): ResolvedTheme;
    /** Resolves a theme by name — bypasses the singleton cache. */
    resolveTheme(name?: string): ResolvedTheme;
    /** Resets the cached singleton. For tests only. */
    _resetForTesting(): void;
}
/**
 * Factory to create a theme resolver with custom env var, presets, and fallback.
 *
 * @example
 * ```ts
 * const { getTheme, resolveTheme } = createThemeResolver({
 *   envVar: 'MY_APP_THEME',
 *   presets: { ...PRESETS, 'my-theme': myTheme },
 *   fallback: CYAN_MAGENTA,
 * });
 * ```
 */
export declare function createThemeResolver(options?: ThemeResolverOptions): ThemeResolver;
/** Returns the current resolved theme (singleton) using the default resolver. */
export declare function getTheme(): ResolvedTheme;
/** Resolves a theme by name using the default resolver. */
export declare function resolveTheme(name?: string): ResolvedTheme;
/** Resets the default resolver's cached singleton. For tests only. */
export declare function _resetThemeForTesting(): void;
//# sourceMappingURL=resolve.d.ts.map