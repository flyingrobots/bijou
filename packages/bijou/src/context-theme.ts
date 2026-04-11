import type { BijouContext } from './ports/context.js';
import { createThemeAccessors } from './core/theme/accessors.js';
import { createResolved, type ResolvedTheme } from './core/theme/resolve.js';
import type { Theme } from './core/theme/tokens.js';

/**
 * Clone a Bijou context with a different already-resolved theme.
 *
 * The original context is left untouched; callers get a fresh object with
 * the same runtime/style/IO ports and updated theme accessors.
 */
export function cloneContextWithResolvedTheme(
  ctx: BijouContext,
  theme: ResolvedTheme,
): BijouContext {
  return {
    ...ctx,
    theme,
    tokenGraph: theme.tokenGraph,
    ...createThemeAccessors(theme),
  };
}

/**
 * Clone a Bijou context with a different theme definition.
 */
export function cloneContextWithTheme(
  ctx: BijouContext,
  theme: Theme,
): BijouContext {
  return cloneContextWithResolvedTheme(
    ctx,
    createResolved(theme, ctx.theme.noColor, ctx.theme.colorScheme),
  );
}
