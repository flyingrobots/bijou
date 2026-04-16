import type { BijouContext } from './ports/context.js';
import { createThemeAccessors } from './core/theme/accessors.js';
import { createResolved, type ResolvedTheme } from './core/theme/resolve.js';
import type { Theme } from './core/theme/tokens.js';

/** Notification emitted when the observed theme graph changes. */
export interface ThemeChange {
  /** The context whose theme graph emitted the change. */
  readonly ctx: BijouContext;
  /** Token path that changed. `'*'` means broad invalidation after import. */
  readonly path: string;
  /** True when the underlying graph requested a full recompute. */
  readonly fullReload: boolean;
}

/** Disposable subscription returned by {@link observeTheme}. */
export interface ThemeObservation {
  /** Stop observing future theme changes. */
  dispose(): void;
}

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

/**
 * Observe theme/token updates for a context.
 *
 * This is the supported third-party authoring seam for reacting to in-place
 * token-graph updates. Handlers should invalidate any cached theme-derived
 * work and re-read tokens through the accessor layer on the provided context.
 *
 * When a caller replaces the entire context object, dispose the old
 * observation and subscribe to the new context instead.
 */
export function observeTheme(
  ctx: BijouContext,
  handler: (change: ThemeChange) => void,
): ThemeObservation {
  return ctx.tokenGraph.on((path) => {
    handler({
      ctx,
      path,
      fullReload: path === '*',
    });
  });
}
