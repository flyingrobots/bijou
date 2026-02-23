import { PRESETS, CYAN_MAGENTA } from './presets.js';
/** Checks the no-color.org spec: NO_COLOR defined (any value) means no color. */
export function isNoColor() {
    return process.env['NO_COLOR'] !== undefined;
}
function createResolved(theme, noColor) {
    return {
        theme,
        noColor,
        ink(token) {
            return noColor ? undefined : token.hex;
        },
        inkStatus(status) {
            const token = theme.status[status];
            const fallback = theme.status['muted'];
            if (token === undefined)
                return noColor ? undefined : fallback?.hex;
            return noColor ? undefined : token.hex;
        },
        hex(token) {
            return token.hex;
        },
    };
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
export function createThemeResolver(options = {}) {
    const envVar = options.envVar ?? 'BIJOU_THEME';
    const presets = options.presets ?? PRESETS;
    const fallback = options.fallback ?? CYAN_MAGENTA;
    let cached = null;
    function getTheme() {
        if (cached !== null)
            return cached;
        const noColor = isNoColor();
        const themeName = process.env[envVar] ?? fallback.name;
        const theme = presets[themeName];
        if (theme === undefined) {
            console.warn(`[bijou] Unknown ${envVar}="${themeName}", falling back to "${fallback.name}".`);
            cached = createResolved(fallback, noColor);
        }
        else {
            cached = createResolved(theme, noColor);
        }
        return cached;
    }
    function resolveTheme(name) {
        const noColor = isNoColor();
        const themeName = name ?? process.env[envVar] ?? fallback.name;
        const theme = presets[themeName];
        if (theme === undefined) {
            console.warn(`[bijou] Unknown theme "${themeName}", falling back to "${fallback.name}".`);
            return createResolved(fallback, noColor);
        }
        return createResolved(theme, noColor);
    }
    function _resetForTesting() {
        cached = null;
    }
    return { getTheme, resolveTheme, _resetForTesting };
}
// Default resolver — uses BIJOU_THEME env var and built-in presets.
const defaultResolver = createThemeResolver();
/** Returns the current resolved theme (singleton) using the default resolver. */
export function getTheme() {
    return defaultResolver.getTheme();
}
/** Resolves a theme by name using the default resolver. */
export function resolveTheme(name) {
    return defaultResolver.resolveTheme(name);
}
/** Resets the default resolver's cached singleton. For tests only. */
export function _resetThemeForTesting() {
    defaultResolver._resetForTesting();
}
//# sourceMappingURL=resolve.js.map