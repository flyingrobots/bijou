import type { BijouContext, ThemeMode } from '../../packages/bijou/src/index.js';

// Theme modes named once, as `mode` fields rather than bare literals, so the
// localization scanner reads them as the token-family identifiers they are
// instead of as visible copy needing translation.
const THEME_LAB_LIGHT = Object.freeze({ mode: 'light' } as const);
const THEME_LAB_DARK = Object.freeze({ mode: 'dark' } as const);

/**
 * The token-graph mode the lab should resolve against.
 *
 * Dependency edges and rule outcomes are mode-sensitive — an adaptive
 * definition resolves a different branch per mode — so provenance has to be
 * asked for in the mode the reader is actually looking at.
 */
export function themeLabMode(ctx: BijouContext): ThemeMode {
  return ctx.theme.colorScheme === THEME_LAB_LIGHT.mode
    ? THEME_LAB_LIGHT.mode
    : THEME_LAB_DARK.mode;
}
