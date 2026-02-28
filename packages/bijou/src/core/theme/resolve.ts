import type { Theme, TokenValue, InkColor } from './tokens.js';
import type { RuntimePort } from '../../ports/runtime.js';
import { PRESETS, CYAN_MAGENTA } from './presets.js';

/**
 * Check the no-color.org spec: `NO_COLOR` defined (any value) means no color.
 * @param runtime - Optional RuntimePort for reading env vars; falls back to `process.env`.
 * @returns True if the `NO_COLOR` environment variable is set.
 */
export function isNoColor(runtime?: RuntimePort): boolean {
  if (runtime) return runtime.env('NO_COLOR') !== undefined;
  return process.env['NO_COLOR'] !== undefined;
}

/** A theme bundled with its noColor flag and convenience accessor methods. */
export interface ResolvedTheme {
  /** The underlying Theme object. */
  theme: Theme;
  /** Whether color output is disabled (per `NO_COLOR`). */
  noColor: boolean;

  /**
   * Return a hex string for Ink's `color=` prop, or `undefined` when noColor.
   * @param token - Token to read the color from.
   * @returns Hex string or `undefined`.
   */
  ink(token: TokenValue): InkColor;

  /**
   * Return a hex string for a status key, or `undefined` when noColor.
   * @param status - Status key string to look up.
   * @returns Hex string or `undefined`.
   */
  inkStatus(status: string): InkColor;

  /**
   * Return the raw hex string from a token (for chalk.hex() or boxen borderColor).
   * @param token - Token to read the color from.
   * @returns Hex string.
   */
  hex(token: TokenValue): string;
}

/**
 * Create a ResolvedTheme from a Theme and a noColor flag.
 * @param theme - The theme to wrap.
 * @param noColor - Whether color output should be suppressed.
 * @returns ResolvedTheme with convenience accessors.
 */
export function createResolved(theme: Theme, noColor: boolean): ResolvedTheme {
  return {
    theme,
    noColor,

    ink(token: TokenValue): InkColor {
      return noColor ? undefined : token.hex;
    },

    inkStatus(status: string): InkColor {
      const token = theme.status[status as keyof typeof theme.status] as TokenValue | undefined;
      const fallback = theme.status['muted' as keyof typeof theme.status] as TokenValue | undefined;
      if (token === undefined) return noColor ? undefined : fallback?.hex;
      return noColor ? undefined : token.hex;
    },

    hex(token: TokenValue): string {
      return token.hex;
    },
  };
}

/** Configuration options for creating a ThemeResolver. */
export interface ThemeResolverOptions {
  /** Environment variable name to read theme from. Default: `'BIJOU_THEME'`. */
  envVar?: string;
  /** Preset registry to look up theme names against. Default: bijou built-in PRESETS. */
  presets?: Record<string, Theme>;
  /** Fallback theme when env var / name doesn't match. Default: CYAN_MAGENTA. */
  fallback?: Theme;
  /** Optional RuntimePort for reading env vars. Falls back to `process.env`. */
  runtime?: RuntimePort;
}

/** A stateful theme resolver that caches the resolved theme and reads env vars. */
export interface ThemeResolver {
  /** Return the current resolved theme (cached singleton). */
  getTheme(): ResolvedTheme;
  /**
   * Resolve a theme by name, bypassing the singleton cache.
   * @param name - Theme name to look up. Falls back to env var, then the default.
   */
  resolveTheme(name?: string): ResolvedTheme;
  /** Reset the cached singleton. For tests only. */
  _resetForTesting(): void;
}

/**
 * Create a ThemeResolver that reads theme name from an env var and looks it up in a preset registry.
 * @param options - Resolver configuration (env var name, presets, fallback, runtime port).
 * @returns ThemeResolver with `getTheme`, `resolveTheme`, and `_resetForTesting` methods.
 */
export function createThemeResolver(options: ThemeResolverOptions = {}): ThemeResolver {
  const envVar = options.envVar ?? 'BIJOU_THEME';
  const presets = options.presets ?? PRESETS;
  const fallback = options.fallback ?? CYAN_MAGENTA;
  const runtime = options.runtime;

  const readEnv = runtime
    ? (key: string) => runtime.env(key)
    : (key: string) => process.env[key];

  let cached: ResolvedTheme | null = null;

  function getTheme(): ResolvedTheme {
    if (cached !== null) return cached;

    const noColor = isNoColor(runtime);
    const themeName = readEnv(envVar) ?? fallback.name;
    const theme = presets[themeName];

    if (theme === undefined) {
      console.warn(`[bijou] Unknown ${envVar}="${themeName}", falling back to "${fallback.name}".`);
      cached = createResolved(fallback, noColor);
    } else {
      cached = createResolved(theme, noColor);
    }

    return cached;
  }

  function resolveTheme(name?: string): ResolvedTheme {
    const noColor = isNoColor(runtime);
    const themeName = name ?? readEnv(envVar) ?? fallback.name;
    const theme = presets[themeName];

    if (theme === undefined) {
      console.warn(`[bijou] Unknown theme "${themeName}", falling back to "${fallback.name}".`);
      return createResolved(fallback, noColor);
    }

    return createResolved(theme, noColor);
  }

  function _resetForTesting(): void {
    cached = null;
  }

  return { getTheme, resolveTheme, _resetForTesting };
}

/** Default resolver — uses `BIJOU_THEME` env var and built-in presets. */
const defaultResolver = createThemeResolver();

/**
 * Return the current resolved theme (singleton) using the default resolver.
 * @returns Cached ResolvedTheme from the default resolver.
 */
export function getTheme(): ResolvedTheme {
  return defaultResolver.getTheme();
}

/**
 * Resolve a theme by name using the default resolver (bypasses cache).
 * @param name - Theme name to look up.
 * @returns ResolvedTheme for the given name.
 */
export function resolveTheme(name?: string): ResolvedTheme {
  return defaultResolver.resolveTheme(name);
}

/** Resets the default resolver's cached singleton. For tests only. */
export function _resetThemeForTesting(): void {
  defaultResolver._resetForTesting();
}
