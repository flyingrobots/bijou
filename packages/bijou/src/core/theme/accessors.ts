import type { Theme, TokenValue, GradientStop } from './tokens.js';
import type { ResolvedTheme } from './resolve.js';

/**
 * Theme accessor functions that look up color tokens from a resolved theme.
 *
 * Returned by {@link createThemeAccessors} and spread into {@link BijouContext}.
 */
export interface ThemeAccessors {
  /** Look up a semantic color token. */
  semantic(key: keyof Theme['semantic']): TokenValue;
  /** Look up a border color token. */
  border(key: keyof Theme['border']): TokenValue;
  /** Look up a surface color token. */
  surface(key: keyof Theme['surface']): TokenValue;
  /** Look up a status color token with fallback to `'muted'`. */
  status(key: string): TokenValue;
  /** Look up a UI element color token with fallback to `semantic.primary`. */
  ui(key: string): TokenValue;
  /** Look up a gradient by key, returning its color stops (or `[]` if unknown). */
  gradient(key: string): GradientStop[];
}

/**
 * Create theme accessor functions from a resolved theme.
 *
 * Centralises the six accessor lambdas (with fallback logic for `status`,
 * `ui`, and `gradient`) so they are defined in one place rather than
 * duplicated across the production factory and test adapter.
 *
 * @param theme - A fully-resolved theme to build accessors for.
 * @returns An object whose properties can be spread into a {@link BijouContext}.
 */
export function createThemeAccessors(theme: ResolvedTheme): ThemeAccessors {
  return {
    semantic: (key) => theme.theme.semantic[key],
    border: (key) => theme.theme.border[key],
    surface: (key) => theme.theme.surface[key],
    status: (key) => (theme.theme.status as Record<string, TokenValue>)[key] ?? (theme.theme.status as Record<string, TokenValue>)['muted']!,
    ui: (key) => (theme.theme.ui as Record<string, TokenValue>)[key] ?? theme.theme.semantic.primary,
    gradient: (key) => (theme.theme.gradient as Record<string, GradientStop[]>)[key] ?? [],
  };
}
